import { Observable, Subject } from 'rxjs';
import { scan, startWith } from 'rxjs/operators';

export type StateObservableAndCallbacksFor<M extends Methods> = [Observable<StateFor<M>>, CallbacksFor<M>];

export type StateFor<M extends Methods> = M extends Methods<infer S, any> ? S : never;

export type CallbacksFor<M extends Methods> = M extends Methods<any, infer R>
    ? {
          [T in ActionUnion<R>['type']]: (...payload: ActionByType<ActionUnion<R>, T>['payload']) => void;
      }
    : never;

export type Methods<S = any, R extends MethodRecordBase<S> = any> = (state: S) => R;
export type MethodRecordBase<S = any> = Record<string, (...args: any[]) => S>;

export type ActionUnion<R extends MethodRecordBase> = {
    [T in keyof R]: { type: T; payload: Parameters<R[T]> };
}[keyof R];

export type ActionByType<A, T> = A extends { type: infer T2 } ? (T extends T2 ? A : never) : never;

export function makeStateAndCallbacks<S, R extends MethodRecordBase<S>>(
    methods: Methods<S, R>,
    initialState: S,
): StateObservableAndCallbacksFor<Methods<S, R>> {
    const subject$ = new Subject<ActionUnion<R>>();
    const reducer = (state: S, action: ActionUnion<R>) => methods(state)[action.type](...action.payload);
    const state$ = subject$.pipe(scan(reducer, initialState), startWith(initialState));

    const actionTypes: ActionUnion<R>['type'][] = Object.keys(methods(initialState));
    const callbacks = actionTypes.reduce((accum, type) => {
        accum[type] = (...payload) => subject$.next({ type, payload } as any);
        return accum;
    }, {} as CallbacksFor<typeof methods>);
    return [state$, callbacks];
}
