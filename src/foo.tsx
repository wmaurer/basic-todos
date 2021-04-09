// import { readonlyArray } from 'fp-ts/ReadonlyArray';
// import { Lens, Prism, Traversal, fromTraversable } from 'monocle-ts';

// type Child = {
//     readonly id: number;
//     readonly value: string;
// };

// type Parent = {
//     readonly children: ReadonlyArray<Child>;
// };

// const children = Lens.fromProp<Parent>()('children'); // Lens<Parent, Child[]>
// const childTraversal = fromTraversable(readonlyArray)<Child>(); // Traversal<Child[], Child>
// const getChildPrism = (id: number): Prism<Child, Child> => Prism.fromPredicate(child => child.id === id);
// const value = Lens.fromProp<Child>()('value'); // Lens<Child, string>
// const getChildTraversal = (id: number): Traversal<Parent, string> =>
//     children.composeTraversal(childTraversal).composePrism(getChildPrism(id)).composeLens(value);

// // getChildTraversal(1).

export {};
