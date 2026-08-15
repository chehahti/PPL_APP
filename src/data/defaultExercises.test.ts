import { describe, it, expect } from 'vitest';
import { INITIAL_EXERCISES, ALL_EXERCISES_DATABASE } from './defaultExercises';
import { MuscleCategory } from '../types/fitness';

describe('Default Exercises Database Integrity', () => {
  describe('INITIAL_EXERCISES', () => {
    it('has valid non-empty list of exercises', () => {
      expect(INITIAL_EXERCISES.length).toBeGreaterThan(0);
    });

    it('has unique IDs for every initial exercise', () => {
      const ids = INITIAL_EXERCISES.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('contains exercises for all 3 core PPL categories (PUSH, PULL, LEGS)', () => {
      const categories: MuscleCategory[] = ['PUSH', 'PULL', 'LEGS'];
      categories.forEach(cat => {
        const matching = INITIAL_EXERCISES.filter(e => e.category === cat);
        expect(matching.length).toBeGreaterThan(0);
      });
    });

    it('has valid attributes (names, target muscles, weights, instructions)', () => {
      INITIAL_EXERCISES.forEach(exo => {
        expect(exo.id).toBeTruthy();
        expect(exo.name).toBeTruthy();
        expect(exo.subGroup).toBeTruthy();
        expect(exo.subGroupNameFr).toBeTruthy();
        expect(exo.targetMuscleFr).toBeTruthy();
        expect(exo.currentMaxWeight).toBeGreaterThan(0);
        expect(exo.defaultMinWeight).toBeGreaterThan(0);
        expect(exo.defaultMaxWeight).toBeGreaterThanOrEqual(exo.defaultMinWeight);
        expect(exo.equipment).toBeTruthy();
        expect(exo.instructionFr).toBeTruthy();
        expect(['kg', 'lbs']).toContain(exo.unit);
      });
    });
  });

  describe('ALL_EXERCISES_DATABASE', () => {
    it('has comprehensive database with substitutions', () => {
      expect(ALL_EXERCISES_DATABASE.length).toBeGreaterThanOrEqual(INITIAL_EXERCISES.length);
    });

    it('ensures every subGroup in INITIAL_EXERCISES has at least one variant in ALL_EXERCISES_DATABASE', () => {
      const subGroups = new Set(INITIAL_EXERCISES.map(e => e.subGroup));
      subGroups.forEach(sg => {
        const variants = ALL_EXERCISES_DATABASE.filter(e => e.subGroup === sg);
        expect(variants.length).toBeGreaterThan(0);
      });
    });
  });
});
