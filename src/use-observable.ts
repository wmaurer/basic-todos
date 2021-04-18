import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';

export function useObservable<A>(observable$: Observable<A>, initialValue: A): A;
export function useObservable<A>(observable$: Observable<A>, initialValue?: A): A | null;
export function useObservable<A>(observable$: Observable<A>, initialValue?: A) {
    const [currentValue, setCurrentValue] = useState<A | null>(
        typeof initialValue !== 'undefined' ? initialValue : null,
    );
    useEffect(() => {
        const subscription = observable$.subscribe({ next: value => setCurrentValue(value) });
        return () => subscription.unsubscribe();
    }, []);
    return currentValue;
}
