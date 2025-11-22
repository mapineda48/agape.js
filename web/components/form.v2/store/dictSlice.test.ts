import dictReducer, { setAtPath, pushAtPath, removeAtPath } from '../store/dictSlice';

describe('dictSlice', () => {
  const initialState = { data: {} };

  it('should handle initial state', () => {
    expect(dictReducer(undefined, { type: 'unknown' })).toEqual({ data: {} });
  });

  it('should handle setAtPath', () => {
    const actual = dictReducer(initialState, setAtPath({ path: ['user', 'name'], value: 'John' }));
    expect(actual.data).toEqual({ user: { name: 'John' } });
  });

  it('should handle pushAtPath', () => {
    const state = { data: { items: ['a'] } };
    const actual = dictReducer(state, pushAtPath({ path: ['items'], value: 'b' }));
    expect(actual.data.items).toEqual(['a', 'b']);
  });

  it('should handle removeAtPath', () => {
    const state = { data: { items: ['a', 'b', 'c'] } };
    const actual = dictReducer(state, removeAtPath({ path: ['items'], index: [1] }));
    expect(actual.data.items).toEqual(['a', 'c']);
  });

  it('should handle multiple removeAtPath', () => {
    const state = { data: { items: ['a', 'b', 'c', 'd'] } };
    const actual = dictReducer(state, removeAtPath({ path: ['items'], index: [1, 3] }));
    expect(actual.data.items).toEqual(['a', 'c']);
  });
});
