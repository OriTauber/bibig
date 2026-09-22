import { describe, expect, it } from 'vitest'
import { filterWorkouts } from './queries'
import type { Workout } from './models'

const first: Workout = { id: 'first', type: 'strength', kind: 'upper', title: 'First', performedAt: '2026-09-01T08:00:00.000Z', exercises: [], createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '' }
const second: Workout = { ...first, id: 'second', title: 'Second', performedAt: '2026-09-02T16:00:00.000Z' }
const sameMinuteLater: Workout = { ...first, id: 'same-minute-later', title: 'Later entry', createdAt: '2026-09-01T08:00:00.500Z' }

describe('workout history filtering', () => {
  it('orders newest first and oldest first according to the selected sort', () => { expect(filterWorkouts([first, second], { sort: 'newest' }).map((workout) => workout.id)).toEqual(['second', 'first']); expect(filterWorkouts([first, second], { sort: 'oldest' }).map((workout) => workout.id)).toEqual(['first', 'second']) })
  it('uses inclusive calendar-date filters', () => expect(filterWorkouts([first, second], { startDate: '2026-09-02', endDate: '2026-09-02' }).map((workout) => workout.id)).toEqual(['second']))
  it('uses millisecond creation time to break ties for workouts recorded in the same minute', () => expect(filterWorkouts([first, sameMinuteLater], { sort: 'newest' }).map((workout) => workout.id)).toEqual(['same-minute-later', 'first']))
})
