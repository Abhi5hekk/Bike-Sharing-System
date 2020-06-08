import React from 'react';
import './App.css';
import MapView from './components/MapView';
import { DataProvider } from './components/DataProvider';

function App() {
  return (
    <div className="App">
      <DataProvider>
        <MapView />
      </DataProvider>
    </div>
  );
}

export default App;
