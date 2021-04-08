import useProfunctorState, { ProfunctorState } from '@staltz/use-profunctor-state';
import { eqNumber } from 'fp-ts/Eq';
import { pipe } from 'fp-ts/function';
import { ordNumber } from 'fp-ts/Ord';
import * as M from 'fp-ts/ReadonlyMap';

import './styles.css';

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

const TodoItem: React.FC<{ prof: ProfunctorState<Todo>; onDelete: () => void }> = ({ prof, onDelete }) => {
    const onEditTodo = (text: string) => {
        prof.setState(a => ({ ...a, text }));
    };
    const onToggleTodo = () => {
        prof.setState(a => ({ ...a, done: !a.done }));
    };
    return (
        <div>
            <input type="text" value={prof.state.text} onChange={({ target }) => onEditTodo(target.value)} />
            <input type="checkbox" checked={prof.state.done} onChange={onToggleTodo} />
            <button type="button" onClick={() => onDelete()}>
                X
            </button>
        </div>
    );
};

function TodoList() {
    const initialState: State = {
        todos: new Map<number, Todo>([
            [0, { id: 0, text: 'foobar', done: false }],
            [1, { id: 1, text: 'bar', done: false }],
        ]),
        selectedFilter: FilterType.All,
    };
    const appProf = useProfunctorState(initialState);
    const todosProf = appProf.promap(
        a => a.todos,
        (todos, state) => ({ ...state, todos }),
    );
    const onDeleteTodo = (id: number) => {
        todosProf.setState(state => pipe(state, M.deleteAt(eqNumber)(id)));
    };

    return (
        <>
            <div>Global app state: {JSON.stringify(todosProf.state, replacer)}</div>
            {pipe(
                todosProf.state,
                M.map(todoItem => {
                    const todoProf = todosProf.promap(
                        todos => todos.get(todoItem.id)!,
                        (todo, todos) => pipe(todos, M.insertAt(eqNumber)(todo.id, todo)),
                    );
                    return <TodoItem key={todoItem.id} prof={todoProf} onDelete={() => onDeleteTodo(todoItem.id)} />;
                }),
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
