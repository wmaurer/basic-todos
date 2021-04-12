import { Subscribe, bind, shareLatest } from '@react-rxjs/core';
import { eqNumber } from 'fp-ts/Eq';
import { pipe } from 'fp-ts/function';
import * as M from 'fp-ts/ReadonlyMap';
import * as MA from 'monocle-ts/lib/At';
import * as L from 'monocle-ts/lib/Lens';
import * as MO from 'monocle-ts/lib/Optional';
import * as React from 'react';
import { Subject, combineLatest, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { makeStateAndCallbacks } from './make-state-and-callbacks';

import './styles.css';

type Todo = { id: number; text: string; done: boolean };

const getTodoLens = (id: number) => pipe(MA.atReadonlyMap(eqNumber)<Todo>().at(id), L.some);

let index = 0;
const [todosMap$, { newTodo, deleteTodo, toggleTodo, editTodo }] = makeStateAndCallbacks(
    state => ({
        newTodo: (text: string) => pipe(state, M.insertAt(eqNumber)(index, { id: index++, text, done: false } as Todo)),
        deleteTodo: (id: number) => pipe(state, M.deleteAt(eqNumber)(id)),
        toggleTodo: (id: number) =>
            pipe(
                getTodoLens(id),
                MO.prop('done'),
                MO.modify(done => !done),
            )(state),
        editTodo: (id: number, text: string) =>
            pipe(
                getTodoLens(id),
                MO.prop('text'),
                MO.modify(() => text),
            )(state),
    }),
    M.fromMap(new Map<number, Todo>()),
);

const todosList$ = todosMap$.pipe(
    map(todosMap => [...todosMap.values()]),
    shareLatest(), // We are using shareLatest because the stats will also consume it
);

export enum FilterType {
    All = 'all',
    Done = 'done',
    Pending = 'pending',
}
const selectedFilter$ = new Subject<FilterType>();
const onSelectFilter = (type: FilterType) => {
    selectedFilter$.next(type);
};
const [useCurrentFilter, currentFilter$] = bind(selectedFilter$.pipe(startWith(FilterType.All)));

const [useTodos, todos$] = bind(
    combineLatest([todosList$, currentFilter$]).pipe(
        map(([todos, currentFilter]) =>
            currentFilter === FilterType.All
                ? todos
                : todos.filter(todo => todo.done === (currentFilter === FilterType.Done)),
        ),
    ),
);

function TodoListFilters() {
    const filter = useCurrentFilter();

    const updateFilter = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
        onSelectFilter(target.value as FilterType);
    };

    return (
        <>
            Filter:
            <select value={filter} onChange={updateFilter}>
                <option value={FilterType.All}>All</option>
                <option value={FilterType.Done}>Completed</option>
                <option value={FilterType.Pending}>Uncompleted</option>
            </select>
        </>
    );
}

const [useTodosStats, stats$] = bind(
    todosList$.pipe(
        map(todosList => {
            const nTotal = todosList.length;
            const nCompleted = todosList.filter(item => item.done).length;
            const nUncompleted = nTotal - nCompleted;
            const percentCompleted = nTotal === 0 ? 0 : Math.round((nCompleted / nTotal) * 100);

            return {
                nTotal,
                nCompleted,
                nUncompleted,
                percentCompleted,
            };
        }),
    ),
    { nTotal: 0, nCompleted: 0, nUncompleted: 0, percentCompleted: 0 },
);

function TodoListStats() {
    const { nTotal, nCompleted, nUncompleted, percentCompleted } = useTodosStats();

    return (
        <ul>
            <li>Total items: {nTotal}</li>
            <li>Items completed: {nCompleted}</li>
            <li>Items not completed: {nUncompleted}</li>
            <li>Percent completed: {percentCompleted}</li>
        </ul>
    );
}

function TodoItemCreator() {
    const [inputValue, setInputValue] = React.useState('');

    const addItem = () => {
        newTodo(inputValue);
        setInputValue('');
    };

    const onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(target.value);
    };

    return (
        <div>
            <input type="text" value={inputValue} onChange={onChange} />
            <button onClick={addItem}>Add</button>
        </div>
    );
}

const TodoItem: React.FC<{ item: Todo }> = ({ item }) => (
    <div>
        <input type="text" value={item.text} onChange={({ target }) => editTodo(item.id, target.value)} />
        <input type="checkbox" checked={item.done} onChange={() => toggleTodo(item.id)} />
        <button onClick={() => deleteTodo(item.id)}>X</button>
    </div>
);

function TodoList() {
    const todoList = useTodos();

    return (
        <>
            <TodoListStats />
            <TodoListFilters />
            <TodoItemCreator />

            {todoList.map(todoItem => (
                <TodoItem key={todoItem.id} item={todoItem} />
            ))}
        </>
    );
}

const provider$ = merge(todos$, stats$);
export default function App(): JSX.Element {
    return (
        <Subscribe source$={provider$}>
            <TodoList />
        </Subscribe>
    );
}
