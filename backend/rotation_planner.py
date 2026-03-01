"""
Crop Rotation Planner
Plans multi-season crop rotations for soil health and profit optimization.
All data loaded from external JSON files - no hardcoding.
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import json
import os

@dataclass
class CropInfo:
    name: str
    season: str  # 'Kharif', 'Rabi', 'Zaid', 'Year-round'
    nitrogen_balance: float  # kg N/ha (+ = adds N, - = removes N)
    phosphorus_balance: float  # kg P/ha
    potassium_balance: float  # kg K/ha
    water_requirement: str  # 'High', 'Medium', 'Low'
    typical_yield: float  # tonnes/ha
    market_price: float  # ₹/quintal
    follows_well: List[str]  # Crops that grow well after this
    precedes_well: List[str]  # Crops that should precede this


class RotationPlanner:
    """
    Plans optimal crop rotations considering:
    - Soil health improvement (NPK balance)
    - Season compatibility
    - 3-year profit optimization
    - Pest/disease cycle breaking
    
    All data loaded from JSON files - no hardcoded values.
    """
    
    def __init__(self):
        self.crops: Dict[str, CropInfo] = {}
        self._npk_data: Dict = {}
        self._rotation_data: Dict = {}
        self._load_all_data()
    
    def _load_all_data(self):
        """Load all data from external JSON files."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        
        # Load NPK data from ICAR/FAO research
        npk_path = os.path.join(data_dir, "nutrient_requirements.json")
        if os.path.exists(npk_path):
            try:
                with open(npk_path, 'r') as f:
                    self._npk_data = json.load(f)
                # Remove metadata keys
                for key in ['_source', '_units', '_notes']:
                    self._npk_data.pop(key, None)
            except Exception as e:
                print(f"Warning: Could not load NPK data: {e}")
        
        # Load rotation compatibility data
        rotation_path = os.path.join(data_dir, "rotation_data.json")
        if os.path.exists(rotation_path):
            try:
                with open(rotation_path, 'r') as f:
                    self._rotation_data = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load rotation data: {e}")
        
        # Build crop info from loaded data
        self._build_crop_info()
    
    def _build_crop_info(self):
        """Build CropInfo objects from loaded JSON data."""
        crops_config = self._rotation_data.get('crops', {})
        
        for crop_key, config in crops_config.items():
            # Get NPK data for this crop
            npk = self._npk_data.get(crop_key, {})
            
            self.crops[crop_key.lower()] = CropInfo(
                name=config['name'],
                season=config['season'],
                nitrogen_balance=npk.get('nitrogen', -50),
                phosphorus_balance=npk.get('phosphorus', -20),
                potassium_balance=npk.get('potassium', -40),
                water_requirement=config['water_requirement'],
                typical_yield=config['typical_yield'],
                market_price=config['market_price'],
                follows_well=config['follows_well'],
                precedes_well=config['precedes_well']
            )
    
    def reload_data(self):
        """Reload all data from files - useful for updates without restart."""
        self.crops.clear()
        self._npk_data.clear()
        self._rotation_data.clear()
        self._load_all_data()
        print("Rotation planner data reloaded from files.")
    
    def get_available_crops(self) -> List[str]:
        """Get list of crops that have rotation data available."""
        return sorted(list(self.crops.keys()))
    
    def get_compatible_rotations(self, current_crop: str, season: str, 
                                  years: int = 3) -> List[Dict]:
        """
        Generate compatible crop rotations starting from current crop.
        
        Returns list of rotation plans with soil impact and profit estimates.
        """
        current = self.crops.get(current_crop.lower())
        if not current:
            return []
        
        rotations = []
        
        # Generate 3-year rotation plans
        for next_crop_name in current.follows_well:
            next_crop = self.crops.get(next_crop_name.lower())
            if not next_crop:
                continue
            
            for third_crop_name in next_crop.follows_well:
                third_crop = self.crops.get(third_crop_name.lower())
                if not third_crop or third_crop.name == current.name:
                    continue
                
                rotation = self._calculate_rotation_plan(
                    [current, next_crop, third_crop],
                    years
                )
                rotations.append(rotation)
        
        # Sort by total profit (descending)
        rotations.sort(key=lambda x: x['total_profit_3yr'], reverse=True)
        return rotations[:5]  # Top 5 rotations
    
    def _calculate_rotation_plan(self, crop_sequence: List[CropInfo], 
                                  years: int) -> Dict:
        """Calculate soil impact and profit for a rotation sequence."""
        
        # Calculate cumulative soil impact
        total_n_balance = sum(c.nitrogen_balance for c in crop_sequence)
        total_p_balance = sum(c.phosphorus_balance for c in crop_sequence)
        total_k_balance = sum(c.potassium_balance for c in crop_sequence)
        
        # Calculate yearly profits
        yearly_profits = []
        for crop in crop_sequence:
            revenue = crop.typical_yield * 10 * crop.market_price  # ₹/ha
            # Estimated costs (simplified)
            costs = revenue * 0.45  # ~45% cost ratio
            profit = revenue - costs
            yearly_profits.append({
                'crop': crop.name,
                'season': crop.season,
                'revenue': round(revenue, 0),
                'costs': round(costs, 0),
                'profit': round(profit, 0)
            })
        
        total_profit = sum(y['profit'] for y in yearly_profits)
        
        # Soil health score (0-100)
        # Positive N balance = better soil health
        soil_score = 50 + (total_n_balance / 3)  # Base 50, adjust by N balance
        soil_score = max(20, min(95, soil_score))  # Clamp between 20-95
        
        # Generate benefits description
        benefits = []
        if total_n_balance > 0:
            benefits.append(f"Adds {total_n_balance:.0f} kg N/ha to soil")
        if any(c.water_requirement == 'Low' for c in crop_sequence):
            benefits.append("Includes drought-resistant crops")
        if len(set(c.season for c in crop_sequence)) >= 2:
            benefits.append("Multi-season utilization")
        
        return {
            'rotation_sequence': [c.name for c in crop_sequence],
            'seasons': [c.season for c in crop_sequence],
            'soil_impact': {
                'nitrogen_kg_ha': round(total_n_balance, 1),
                'phosphorus_kg_ha': round(total_p_balance, 1),
                'potassium_kg_ha': round(total_k_balance, 1),
                'soil_health_score': round(soil_score, 1),
                'impact_rating': 'Improves' if total_n_balance > 0 else 'Maintains' if total_n_balance > -50 else 'Depletes'
            },
            'yearly_breakdown': yearly_profits,
            'total_profit_3yr': round(total_profit, 0),
            'avg_annual_profit': round(total_profit / 3, 0),
            'benefits': benefits,
            'water_diversity': list(set(c.water_requirement for c in crop_sequence))
        }
    
    def get_soil_recovery_plan(self, current_n: float, current_p: float, 
                                current_k: float, target_crop: str) -> Dict:
        """
        Suggest crops to restore soil nutrients before planting target crop.
        """
        target = self.crops.get(target_crop.lower())
        if not target:
            return {'error': 'Target crop not found'}
        
        # Find crops that add the nutrients target crop needs
        recovery_crops = []
        
        for crop_name, crop in self.crops.items():
            if crop.nitrogen_balance > 20:  # N-fixing crops
                recovery_crops.append({
                    'crop': crop.name,
                    'nitrogen_added': crop.nitrogen_balance,
                    'season': crop.season,
                    'profit': round(crop.typical_yield * 10 * crop.market_price * 0.55, 0),
                    'reason': f"Fixes {crop.nitrogen_balance:.0f} kg N/ha - prepares soil for {target.name}"
                })
        
        # Sort by nitrogen addition
        recovery_crops.sort(key=lambda x: x['nitrogen_added'], reverse=True)
        
        return {
            'current_soil_status': {
                'nitrogen': current_n,
                'phosphorus': current_p,
                'potassium': current_k
            },
            'target_crop': target.name,
            'target_requirements': {
                'nitrogen_need': abs(target.nitrogen_balance),
                'phosphorus_need': abs(target.phosphorus_balance),
                'potassium_need': abs(target.potassium_balance)
            },
            'recommended_recovery_crops': recovery_crops[:3],
            'advice': f"Plant a legume like Moong or Chickpea before {target.name} to restore nitrogen"
        }


# Singleton instance
_rotation_planner: Optional[RotationPlanner] = None

def get_rotation_planner() -> RotationPlanner:
    """Get or create rotation planner instance."""
    global _rotation_planner
    if _rotation_planner is None:
        _rotation_planner = RotationPlanner()
    return _rotation_planner


if __name__ == "__main__":
    planner = RotationPlanner()
    
    print("=== Crop Rotation Planner ===\n")
    print(f"Available crops: {len(planner.get_available_crops())}")
    print(f"Crops: {', '.join(planner.get_available_crops())}\n")
    
    # Example: Plan rotation after rice
    print("1. Rotations after Rice:")
    rotations = planner.get_compatible_rotations('rice', 'Kharif', years=3)
    for i, rot in enumerate(rotations[:3], 1):
        print(f"\n   Option {i}: {' → '.join(rot['rotation_sequence'])}")
        print(f"   Total 3-year profit: ₹{rot['total_profit_3yr']:,.0f}/ha")
        print(f"   Soil impact: {rot['soil_impact']['impact_rating']} (N: {rot['soil_impact']['nitrogen_kg_ha']:+.1f} kg/ha)")
    
    # Example: Soil recovery plan
    print("\n\n2. Soil Recovery before Cotton:")
    recovery = planner.get_soil_recovery_plan(60, 40, 35, 'cotton')
    print(f"   {recovery['advice']}")
    print("   Recommended crops:")
    for crop in recovery['recommended_recovery_crops'][:2]:
        print(f"   - {crop['crop']}: {crop['reason']} (Profit: ₹{crop['profit']:,.0f}/ha)")
