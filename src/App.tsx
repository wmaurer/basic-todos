import { eqNumber } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import * as Id from 'fp-ts/Identity';
import { ordNumber } from 'fp-ts/Ord';
import { readonlyArray } from 'fp-ts/ReadonlyArray';
import * as M from 'fp-ts/ReadonlyMap';
import * as ML from 'monocle-ts/Lens';
import * as MA from 'monocle-ts/lib/At';
import * as MI from 'monocle-ts/lib/Ix';
import * as MO from 'monocle-ts/lib/Optional';
import * as MT from 'monocle-ts/lib/Traversal';
import { composeTraversal } from 'monocle-ts/lib/Traversal';
import * as MP from 'monocle-ts/Prism';
import { memo, useCallback, useState } from 'react';

import './styles.css';

const ff = (null as unknown) as ReadonlyMap<number, string>;
// const x: Traversal<string[], string>
// const x = pipe(ff, M.getWitherable(ordNumber));

export enum FilterType {
    All = 'all',
    Done = 'done',
    Pending = 'pending',
}

interface Todo {
    id: number;
    text: string;
    done: boolean;
}

interface State {
    readonly todos: ReadonlyMap<number, Todo>;
    readonly selectedFilter: FilterType;
}

// function TodoListFilters() {
//     const filter = useCurrentFilter();

//     const updateFilter = ({ target }: React.ChangeEvent<HTMLSelectElement>) => {
//         onSelectFilter(target.value as FilterType);
//     };

//     return (
//         <>
//             Filter:
//             <select value={filter} onChange={updateFilter}>
//                 <option value={FilterType.All}>All</option>
//                 <option value={FilterType.Done}>Completed</option>
//                 <option value={FilterType.Pending}>Uncompleted</option>
//             </select>
//         </>
//     );
// }

// const [useTodosStats, stats$] = bind(
//     todosList$.pipe(
//         map(todosList => {
//             const nTotal = todosList.length;
//             const nCompleted = todosList.filter(item => item.done).length;
//             const nUncompleted = nTotal - nCompleted;
//             const percentCompleted = nTotal === 0 ? 0 : Math.round((nCompleted / nTotal) * 100);

//             return {
//                 nTotal,
//                 nCompleted,
//                 nUncompleted,
//                 percentCompleted,
//             };
//         }),
//     ),
//     { nTotal: 0, nCompleted: 0, nUncompleted: 0, percentCompleted: 0 },
// );

// function TodoListStats() {
//     const { nTotal, nCompleted, nUncompleted, percentCompleted } = useTodosStats();

//     return (
//         <ul>
//             <li>Total items: {nTotal}</li>
//             <li>Items completed: {nCompleted}</li>
//             <li>Items not completed: {nUncompleted}</li>
//             <li>Percent completed: {percentCompleted}</li>
//         </ul>
//     );
// }

// const TodoItemCreator: React.FC<{ onNewTodo: (text: string) => void }> = ({ onNewTodo }) => {
//     const [inputValue, setInputValue] = useState('');

//     const addItem = () => {
//         onNewTodo(inputValue);
//         setInputValue('');
//     };

//     const onChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
//         setInputValue(target.value);
//     };

//     return (
//         <div>
//             <input type="text" value={inputValue} onChange={onChange} />
//             <button onClick={addItem}>Add</button>
//         </div>
//     );
// };
const noop = () => {};

interface TodoEditableProperties extends Pick<Todo, 'text' | 'done'> {}
type TodoUpdater = (f: TodoEditableProperties) => TodoEditableProperties;

interface TodoItemProps {
    todo: Todo;
    onChange: (updater: TodoUpdater) => void;
    onDelete: () => void;
}
const TodoItem = memo(({ todo, onChange, onDelete }: TodoItemProps) => {
    const onEdit = (text: string) => onChange(s => ({ ...s, text }));
    const onToggle = () => {
        onChange(s => ({ ...s, done: !s.done }));
    };
    return (
        <div>
            <input type="text" value={todo.text} onChange={({ target }) => onEdit(target.value)} />
            <input type="checkbox" checked={todo.done} onChange={onToggle} />
            <button type="button" onClick={onDelete}>
                X
            </button>
        </div>
    );
});

// function useMonocleState<T = unknown>(initial: T) {
//     const [state, setState] = useState<T>(initial);

// }

const initialState: State = {
    todos: M.fromMap(
        new Map<number, Todo>([
            [0, { id: 0, text: 'foobar', done: false }],
            [1, { id: 1, text: 'bar', done: false }],
        ]),
    ),
    selectedFilter: FilterType.All,
};
const getTodosLens = pipe(ML.id<State>(), ML.prop('todos'));
const deleteTodoLens = (id: number) => pipe(getTodosLens, ML.modify(flow(M.deleteAt(eqNumber)(id))));
const getTodoLens = (id: number) =>
    pipe(
        getTodosLens,
        ML.composeOptional(pipe(MI.indexReadonlyMap(eqNumber)<Todo>().index(id), MO.props('text', 'done'))),
    );

function TodoList() {
    const [state, setState] = useState(initialState);
    const onTodoChangeCallback = useCallback(
        (todo: Todo) => (updater: TodoUpdater) => {
            setState(getTodoLens(todo.id).set(updater(todo))(state));
        },
        [state],
    );
    const onDeleteCallback = useCallback(
        (id: number) => () => {
            setState(deleteTodoLens(id)(state));
        },
        [state],
    );

    return (
        <>
            <div>Global app state: {JSON.stringify(state.todos, replacer)}</div>
            {pipe(
                state.todos,
                M.map(todoItem => (
                    <TodoItem
                        key={todoItem.id}
                        todo={todoItem}
                        onChange={onTodoChangeCallback(todoItem)}
                        onDelete={onDeleteCallback(todoItem.id)}
                    />
                )),
                M.collect(ordNumber)((_, a) => a),
            )}
        </>
    );
}

export default function App(): JSX.Element {
    return <TodoList />;
}

function replacer(_: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

// type Child = {
//     readonly id: number;
//     readonly value: string;
// };

// type Parent = {
//     readonly children: ReadonlyArray<Child>;
// };
// const children = pipe(ML.id<Parent>(), ML.prop('children'));
// const childTraversal = MT.fromTraversable(readonlyArray)<Child>(); // Traversal<Child[], Child>
// const getChildPrism = (id: number): MP.Prism<Child, Child> => MP.fromPredicate(child => child.id === id);
// const value = pipe(ML.id<Child>(), ML.prop('value'));
// const getChildTraversal = (id: number) =>
//     pipe(children, ML.composeTraversal(childTraversal), MT.composePrism(getChildPrism(id)), MT.composeLens(value));
//     // getChildTraversal(1).modifyF
// // const fistChild = MI.indexReadonlyArray<Child>().index(0);
// // const foo = getChildTraversal(1).modifyF(Id.identity)(() => 'foo');
// // foo.modifyF;
