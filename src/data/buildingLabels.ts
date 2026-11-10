import { buildings } from './buildings'

// Keep the existing map label for the academic building.
export const buildingNames: Record<string, string> = Object.fromEntries(
  buildings.map(building => [building.id,
    building.id === 'academic-1' ? 'Новый корпус НГУ' : building.name]),
)
