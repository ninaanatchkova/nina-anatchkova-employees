import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {

    if (event.target.files) {
      const worker = new Worker(new URL("./processCSV.worker.ts", import.meta.url));

      worker.postMessage(event.target.files[0])
    }
  }

  return (
    <div className="App">
      <header>
        <h1>Employee collaboration data</h1>
      </header>
      <main>
        <p>This application identifies the pair of employees who have worked together on common projects for the longest period of time.</p>
        <p>Please upload a CSV file with employee records to continue:</p>
        <input type="file"
           id="records" name="records"
           accept="csv"
           onChange={changeHandler}
        />
      </main>
    </div>
  );
}

export default App;
