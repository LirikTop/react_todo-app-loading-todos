/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import cn from 'classnames';

type FilterSelect = 'All' | 'Complited' | 'Active' | '';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<number>(0);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [fiilterIndex, setFilterIndex] = useState<number>(0);
  const [selecedFilter, setSelectedFilter] = useState<FilterSelect>('');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const filterSelect: FilterSelect[] = React.useMemo(
    () => ['All', 'Active', 'Complited'],
    [],
  );

  const deleteTodo = useCallback(async (todoId: number) => {
    setErrorMessage('');
    setLoading(true);
    try {
      await todoService.deleteTodo(todoId);
      setTodos(curentTodos => curentTodos.filter(todo => todo.id !== todoId));
      setAllTodos(current => current - 1);
    } catch (error) {
      setErrorMessage('Unable to delete a todo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addTodo = useCallback(async ({ title, userId, completed }: Todo) => {
    setErrorMessage('');
    setLoading(true);

    try {
      const newTodo = await todoService.addTodo({ title, userId, completed });

      setTodos(currentTodos => [...currentTodos, newTodo]);
      setAllTodos(current => current + 1);

      return newTodo;
    } catch (error) {
      setErrorMessage('Unable to add a todo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTodo = useCallback(async (TodoToUpdate: Todo) => {
    setErrorMessage('');
    setSelectedTodo(null);

    todoService
      .updateTodo(TodoToUpdate)
      .then(updatedTodo => {
        setTodos(currentTodo => {
          return currentTodo.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo,
          );
        });
      })
      .catch(() => setErrorMessage('Unable to update a todo'));
  }, []);

  const defaultValue = useCallback(() => {
    setEditTitle('');
    setSelectedTodo(null);
    setErrorMessage('');
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmiting(true);

      if (!newTodoTitle) {
        setErrorMessage('Title should not be empty');

        return;
      }

      addTodo({
        title: newTodoTitle,
        completed: false,
        id: 0,
        userId: todoService.USER_ID,
      })
        .then(data => {
          if (data) {
            setNewTodoTitle('');
          }
        })
        .finally(() => setIsSubmiting(false));
    },
    [newTodoTitle, addTodo],
  );

  const handleEdit = useCallback((data: Todo) => {
    setEditTitle(data.title);
    setSelectedTodo(data);
  }, []);

  const hendleSelectFilter = useCallback(
    (index: number) => {
      setFilterIndex(index);
      setSelectedFilter(filterSelect[index]);
    },
    [filterSelect],
  );

  const handleUpdateTitle = useCallback(
    (data: Todo) => {
      updateTodo({
        title: editTitle,
        completed: data.completed,
        id: data.id,
        userId: data.userId,
      });
    },
    [editTitle, updateTodo],
  );

  const handleUpdateCompleted = useCallback(
    (data: Todo, bool: boolean = data.completed) => {
      const newObject = {
        title: data.title,
        completed: !bool,
        id: data.id,
        userId: data.userId,
      };

      updateTodo({ ...newObject });

      return newObject;
    },
    [updateTodo],
  );

  const checkTodoCompleted = useCallback(() => {
    return todos.filter(todo => todo.completed).length;
  }, [todos]);

  const checkFooterActive = useCallback(() => {
    return Boolean(allTodos);
  }, [allTodos]);

  const handleToggleActivate = useCallback(() => {
    const toggleBoolean = checkTodoCompleted() === allTodos;

    todos.map(todo => updateTodo(handleUpdateCompleted(todo, toggleBoolean)));
  }, [handleUpdateCompleted, todos, updateTodo, checkTodoCompleted, allTodos]);

  const handleClearCompleted = useCallback(() => {
    todos.map(todo => {
      if (todo.completed) {
        deleteTodo(todo.id);
      }
    });
  }, [todos, deleteTodo]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current?.focus();
    }
  }, [selectedTodo]);

  useEffect(() => {
    setErrorMessage('');
    const delayTimer = setTimeout(() => setLoading(true), 200);

    todoService
      .getTodos()
      .then(data => {
        setAllTodos(data.length);

        return data.filter(todo => {
          if (selecedFilter === 'Complited') {
            return todo.completed;
          }

          if (selecedFilter === 'Active') {
            return !todo.completed;
          }

          return data;
        });
      })
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally(() => {
        clearTimeout(delayTimer);
        setTimeout(() => setLoading(false), 500);
      });
  }, [selecedFilter]);

  useEffect(() => {
    if (errorMessage.length) {
      const delayTimer = setTimeout(() => setErrorMessage(''), 3000);

      return () => clearTimeout(delayTimer);
    }

    return;
  }, [errorMessage]);

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          {checkFooterActive() && (
            <button
              type="button"
              className={cn('todoapp__toggle-all', {
                active: checkTodoCompleted(),
              })}
              data-cy="ToggleAllButton"
              onClick={handleToggleActivate}
            />
          )}

          {/* Add a todo on form submit */}
          <form onSubmit={e => handleSubmit(e)}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={e => setNewTodoTitle(e.target.value)}
              ref={inputRef}
              disabled={isSubmiting}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {/* This is a completed todo */}
          {todos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={cn('todo', { completed: todo.completed })}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onClick={() => handleUpdateCompleted(todo)}
                  disabled={loading}
                />
              </label>

              {!(selectedTodo && selectedTodo.id === todo.id) ? (
                <>
                  <span
                    data-cy="TodoTitle"
                    className="todo__title"
                    onDoubleClick={() => handleEdit(todo)}
                  >
                    {todo.title}
                  </span>

                  {/* Remove button appears only on hover */}
                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    ×
                  </button>
                </>
              ) : (
                <form onSubmit={() => handleUpdateTitle(todo)}>
                  <input
                    data-cy="TodoTitleField"
                    type="text"
                    className="todo__title-field"
                    placeholder="Empty todo will be deleted"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => defaultValue()}
                    ref={inputRef}
                  />
                </form>
              )}

              {/* overlay will cover the todo while it is being deleted or updated */}
              <div
                data-cy="TodoLoader"
                className={cn('modal overlay', { 'is-active': loading })}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
        </section>

        {/* Hide the footer if there are no todos */}
        {checkFooterActive() && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todos.filter(todo => !todo.completed).length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              {filterSelect.map((option, index) => (
                <a
                  key={option}
                  href={`#/${index ? filterSelect[index] : ''}`}
                  className={`filter__link ${index === fiilterIndex ? 'selected' : ''}`}
                  data-cy={`FilterLink${option}`}
                  onClick={() => hendleSelectFilter(index)}
                >
                  {option}
                </a>
              ))}
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={handleClearCompleted}
              disabled={!checkTodoCompleted()}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage.length },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {/* show only one message at a time */}
        {errorMessage}
      </div>
    </div>
  );
};
