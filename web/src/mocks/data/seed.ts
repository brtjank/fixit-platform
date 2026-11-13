/**
 * Deterministic seed dataset for a fictional Warsaw-based service company.
 * Same data on every reload (seeded PRNG); mutations live in memory for the session.
 */
import { ServiceRequestStatus, UserRole, type ServiceLog, type ServiceRequest, type Tenant, type User, type WorkerProfile } from '@/shared/types'

// ---- tiny seeded PRNG (mulberry32) -------------------------------------------
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261111)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

/** Stable pseudo-GUID from a label (readable in devtools, valid GUID shape). */
export function guid(label: string) {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < label.length; i++) {
    h1 = Math.imul(h1 ^ label.charCodeAt(i), 0x01000193) >>> 0
    h2 = Math.imul(h2 + label.charCodeAt(i), 0x811c9dc5) >>> 0
  }
  const hex = (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const NOW = new Date('2026-11-11T09:30:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString()
const daysAgo = (d: number, h = 0) => hoursAgo(d * 24 + h)

// ---- Tenant -------------------------------------------------------------------
export const TENANT_ID = guid('tenant:hydro-serwis')

export const tenant: Tenant = {
  id: TENANT_ID,
  tenantId: TENANT_ID,
  name: 'Hydro-Serwis Nowak',
  description: 'Plumbing, heating & HVAC services for residential and commercial clients in Warsaw.',
  isActive: true,
  createdAt: daysAgo(400),
  isDeleted: false,
}

// ---- Users --------------------------------------------------------------------
function user(key: string, firstName: string, lastName: string, role: UserRole, createdDaysAgo: number, isActive = true): User {
  const email = `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l') + (role === UserRole.Customer ? '@gmail.com' : '@hydro-serwis.pl')
  return {
    id: guid(`user:${key}`),
    tenantId: TENANT_ID,
    email,
    firstName,
    lastName,
    role,
    isActive,
    createdAt: daysAgo(createdDaysAgo),
    isDeleted: false,
  }
}

export const admins: User[] = [
  user('admin1', 'Marta', 'Nowak', UserRole.Admin, 400),
  user('admin2', 'Piotr', 'Zieliński', UserRole.Admin, 320),
]

export const workers: User[] = [
  user('worker1', 'Tomasz', 'Kowalczyk', UserRole.Worker, 380),
  user('worker2', 'Anna', 'Wiśniewska', UserRole.Worker, 300),
  user('worker3', 'Krzysztof', 'Lewandowski', UserRole.Worker, 260),
  user('worker4', 'Ewa', 'Dąbrowska', UserRole.Worker, 190),
  user('worker5', 'Michał', 'Wójcik', UserRole.Worker, 120),
  user('worker6', 'Jakub', 'Kamiński', UserRole.Worker, 45),
  user('worker7', 'Paweł', 'Mazur', UserRole.Worker, 500, false),
]

export const customers: User[] = [
  user('cust1', 'Katarzyna', 'Jabłońska', UserRole.Customer, 210),
  user('cust2', 'Robert', 'Szymański', UserRole.Customer, 180),
  user('cust3', 'Agnieszka', 'Woźniak', UserRole.Customer, 150),
  user('cust4', 'Marcin', 'Kozłowski', UserRole.Customer, 140),
  user('cust5', 'Joanna', 'Krawczyk', UserRole.Customer, 120),
  user('cust6', 'Grzegorz', 'Piotrowski', UserRole.Customer, 100),
  user('cust7', 'Magdalena', 'Grabowska', UserRole.Customer, 90),
  user('cust8', 'Łukasz', 'Pawlak', UserRole.Customer, 75),
  user('cust9', 'Natalia', 'Michalska', UserRole.Customer, 60),
  user('cust10', 'Adam', 'Król', UserRole.Customer, 40),
  user('cust11', 'Monika', 'Wieczorek', UserRole.Customer, 20),
  user('cust12', 'Bartosz', 'Jankowski', UserRole.Customer, 6),
]

export const users: User[] = [...admins, ...workers, ...customers]

// ---- Worker profiles ----------------------------------------------------------
const SPECIALIZATIONS = ['Plumbing', 'Heating & boilers', 'HVAC / air conditioning', 'Electrical', 'General maintenance']

export const workerProfiles: WorkerProfile[] = workers.map((w, i) => ({
  id: guid(`profile:${w.id}`),
  tenantId: TENANT_ID,
  userId: w.id,
  specialization: SPECIALIZATIONS[i % SPECIALIZATIONS.length]!,
  phoneNumber: `+48 ${between(500, 799)} ${between(100, 999)} ${between(100, 999)}`,
  isAvailable: w.isActive && i !== 3,
  createdAt: w.createdAt,
  isDeleted: false,
}))

// ---- Service requests ---------------------------------------------------------
const REQUESTS: Array<[string, string]> = [
  ['Leaking kitchen sink trap', 'Water pools under the sink after every use. The plastic trap looks cracked near the joint. Cabinet floor is already swollen.'],
  ['Boiler not heating water', 'Vaillant combi boiler shows error F.28 and does not ignite. Radiators are cold, no hot water since yesterday evening.'],
  ['Air conditioning unit dripping indoors', 'Split AC in the living room drips water from the indoor unit. Drain line might be clogged. Unit is 3 years old.'],
  ['Radiator valve stuck', 'Thermostatic valve on bedroom radiator will not turn. Radiator stays hot even at zero setting.'],
  ['Low water pressure in bathroom', 'Shower pressure dropped significantly over the last week. Kitchen tap is fine. Building is from 1998.'],
  ['Annual boiler service', 'Yearly inspection and service of gas boiler required for warranty. Flexible on date, weekday mornings preferred.'],
  ['Blocked toilet in office restroom', 'Second-floor restroom toilet is blocked and overflowing. Office of 20 people, urgent.'],
  ['Install new dishwasher', 'Need the new Bosch dishwasher connected to water and drain. Old one needs disconnecting and removal.'],
  ['Underfloor heating zone cold', 'One zone of the underfloor heating (hallway) stays cold. Other zones work. Manifold actuators may be faulty.'],
  ['Replace bathroom faucet', 'Old faucet corroded and dripping. Have purchased a replacement (Grohe) — just need installation.'],
  ['Water heater making loud noise', 'Electric water heater makes a loud banging noise when heating. Likely limescale build-up.'],
  ['AC maintenance for server room', 'Quarterly maintenance of two wall-mounted units in server room. Filters, refrigerant check, drain flush.'],
  ['Burst pipe in basement', 'Pipe burst in basement storage, water on the floor. Main valve closed. Need emergency repair.'],
  ['Thermostat not responding', 'Smart thermostat screen is blank. Boiler runs constantly. Replaced batteries, no change.'],
  ['Sewer smell from floor drain', 'Strong sewer smell from the laundry room floor drain, especially in the mornings.'],
  ['Outdoor tap replacement', 'Garden tap froze and cracked over winter. Need a frost-proof replacement installed.'],
  ['Install water softener', 'Have a new water softener unit, need professional installation on the main supply line.'],
  ['Heat pump error code', 'Daikin heat pump shows error U0 intermittently and stops heating. Happens mostly at night.'],
  ['Radiator bleeding and balancing', 'Several radiators are cold at the top. Need system bled and balanced before winter.'],
  ['Shower drain slow', 'Shower drain takes minutes to empty. Tried chemical cleaner, no improvement.'],
  ['Replace kitchen mixer tap', 'Kitchen mixer tap handle broke off. Need a replacement installed, can supply or buy.'],
  ['AC unit not cooling', 'Bedroom AC blows room-temperature air. Outdoor unit fan runs. Possibly low refrigerant.'],
  ['Washing machine hose leak', 'Inlet hose of washing machine leaking at the wall connection. Shut-off valve also stiff.'],
  ['Gas boiler pressure keeps dropping', 'Boiler pressure drops from 1.5 to 0.5 bar every few days. No visible leaks. Suspect expansion vessel.'],
  ['Install bidet shower', 'Install a bidet shower next to the toilet in the guest bathroom. Water supply available.'],
  ['Ventilation fan not working', 'Bathroom extractor fan stopped working. Switch and wiring look fine from outside.'],
  ['Heating system inspection before sale', 'Need a written inspection report of the heating system for the apartment sale.'],
  ['Fix dripping shower head', 'Shower head drips constantly after closing the tap. Cartridge probably worn.'],
  ['Replace main shut-off valve', 'Main water shut-off valve does not close fully. Needs replacement, will coordinate with building admin.'],
  ['Office kitchen: install instant hot water tap', 'Install a Quooker-style instant boiling tap in the office kitchen. Power outlet available.'],
  ['Condensation on cold water pipes', 'Heavy condensation on exposed cold water pipes in the utility room, dripping on the floor.'],
  ['Radiator replacement', 'Replace the old cast-iron radiator in the living room with a modern panel radiator.'],
  ['Hot water takes too long', 'Takes 2+ minutes for hot water to reach the bathroom. Would like a recirculation pump installed.'],
  ['Boiler flue inspection', 'Insurance requires a flue inspection certificate for the gas boiler.'],
  ['AC installation in new office', 'Install two 3.5kW split units in a newly rented office space. Need quotation first.'],
  ['Water meter leaking', 'Water meter connection leaking slightly. Building admin says it is on our side.'],
  ['Pressure reducing valve replacement', 'Water pressure in the house is too high (6 bar). Install or replace pressure reducing valve.'],
  ['Clogged kitchen drain', 'Kitchen sink drains very slowly, gurgles. Probably grease build-up in the pipe.'],
  ['Heating not working in one apartment', 'Rental apartment tenant reports no heating. Boiler runs but radiators stay cold.'],
  ['Toilet constantly running', 'Toilet cistern keeps refilling every few minutes. Flapper or fill valve worn out.'],
  ['Leak under bathtub', 'Water stain on the ceiling of the flat below, directly under our bathtub.'],
  ['Replace circulation pump', 'Heating circulation pump is noisy and heating is uneven. Grundfos pump, 12 years old.'],
]

interface Spec {
  status: ServiceRequestStatus
  createdDaysAgo: number
  workerIdx: number | null
}

const activeWorkers = workers.filter((w) => w.isActive)

function specFor(i: number): Spec {
  // Distribution: ~15% pending, ~15% assigned, ~20% in progress, ~40% completed, ~10% cancelled
  const r = rand()
  if (i < 3) return { status: ServiceRequestStatus.Pending, createdDaysAgo: between(0, 2), workerIdx: null }
  if (r < 0.14) return { status: ServiceRequestStatus.Pending, createdDaysAgo: between(0, 6), workerIdx: null }
  if (r < 0.3) return { status: ServiceRequestStatus.Assigned, createdDaysAgo: between(1, 8), workerIdx: between(0, activeWorkers.length - 1) }
  if (r < 0.5) return { status: ServiceRequestStatus.InProgress, createdDaysAgo: between(1, 12), workerIdx: between(0, activeWorkers.length - 1) }
  if (r < 0.9) return { status: ServiceRequestStatus.Completed, createdDaysAgo: between(3, 60), workerIdx: between(0, activeWorkers.length - 1) }
  return { status: ServiceRequestStatus.Cancelled, createdDaysAgo: between(2, 50), workerIdx: rand() < 0.5 ? between(0, activeWorkers.length - 1) : null }
}

const COMPLETION_NOTES = [
  'Replaced the faulty part and tested under load. Customer confirmed everything works.',
  'Cleaned and descaled. Advised customer on yearly maintenance.',
  'Repair completed. Recommended replacing the unit within 2 years.',
  'Issue resolved on site. No parts required.',
  'Installed and commissioned. Handed over the warranty card.',
]
const PROGRESS_NOTES = [
  'On site, diagnosing the issue.',
  'Part ordered, waiting for delivery (ETA 2 days).',
  'Started work, needs a second visit to finish.',
  'Found the root cause, replacing the component now.',
]
const CANCEL_NOTES = [
  'Customer resolved the issue themselves.',
  'Customer cancelled — chose another provider.',
  'Duplicate of another request.',
  'Customer not reachable after three attempts.',
]

export const serviceRequests: ServiceRequest[] = []
export const serviceLogs: ServiceLog[] = []

REQUESTS.forEach(([title, description], i) => {
  const spec = specFor(i)
  const id = guid(`sr:${i}:${title}`)
  const customer = customers[i % customers.length]!
  const worker = spec.workerIdx !== null ? activeWorkers[spec.workerIdx]! : null
  const createdAt = daysAgo(spec.createdDaysAgo, between(0, 10))
  const createdMs = new Date(createdAt).getTime()
  const step = (h: number) => new Date(createdMs + h * 3_600_000).toISOString()

  let notes: string | null = null
  const admin = pick(admins)

  const log = (prev: ServiceRequestStatus, next: ServiceRequestStatus, at: string, n: string | null, by: string | null) =>
    serviceLogs.push({
      id: guid(`log:${id}:${prev}:${next}`),
      tenantId: TENANT_ID,
      serviceRequestId: id,
      previousStatus: prev,
      newStatus: next,
      notes: n,
      changedByUserId: by,
      createdAt: at,
      isDeleted: false,
    })

  if (worker) log(ServiceRequestStatus.Pending, ServiceRequestStatus.Assigned, step(between(1, 8)), null, admin.id)

  if (spec.status === ServiceRequestStatus.InProgress || spec.status === ServiceRequestStatus.Completed) {
    notes = pick(PROGRESS_NOTES)
    log(ServiceRequestStatus.Assigned, ServiceRequestStatus.InProgress, step(between(10, 30)), notes, worker!.id)
  }
  if (spec.status === ServiceRequestStatus.Completed) {
    notes = pick(COMPLETION_NOTES)
    log(ServiceRequestStatus.InProgress, ServiceRequestStatus.Completed, step(between(32, 96)), notes, worker!.id)
  }
  if (spec.status === ServiceRequestStatus.Cancelled) {
    notes = pick(CANCEL_NOTES)
    log(worker ? ServiceRequestStatus.Assigned : ServiceRequestStatus.Pending, ServiceRequestStatus.Cancelled, step(between(5, 40)), notes, admin.id)
  }

  serviceRequests.push({
    id,
    tenantId: TENANT_ID,
    title,
    description,
    customerId: customer.id,
    assignedWorkerId: worker?.id ?? null,
    status: spec.status,
    notes,
    createdAt,
    isDeleted: false,
  })
})

// Newest first, like a typical listing.
serviceRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
serviceLogs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

// ---- Demo accounts shown on the login page ----------------------------------
/**
 * Password of every seeded account — in mock mode (MSW login) and in live mode (`dev/seed.sql` stores its
 * PBKDF2 hash). Imported by the login page in both modes, so keep this module free of MSW imports.
 */
export const DEMO_PASSWORD = 'Demo123!'

export const DEMO_ACCOUNTS = [
  { role: 'Admin' as const, email: admins[0]!.email, name: 'Marta Nowak', hint: 'Full access: dashboard, users, assignments' },
  { role: 'Worker' as const, email: workers[0]!.email, name: 'Tomasz Kowalczyk', hint: 'Sees assigned jobs, updates status' },
  { role: 'Customer' as const, email: customers[11]!.email, name: 'Bartosz Jankowski', hint: 'Submits and tracks own requests' },
]
