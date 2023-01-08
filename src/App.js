import './App.css';
import React from 'react';
import Board from './Board';

function App(){
  return (
    <>  
      <h1>React Saper</h1>
      <Board x={10} y={10} bombCount={3}/>
    </>
  );
}

export default App;