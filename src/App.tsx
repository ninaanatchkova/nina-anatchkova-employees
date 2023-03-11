import React, { useState } from 'react';
import './App.css';
import { CoworkingPairEntry } from './types';

function App() {
  const [result, setResult] = useState<CoworkingPairEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {

    if (event.target.files) {
      const worker = new Worker(new URL("./processCSV.worker.ts", import.meta.url));

      worker.postMessage(event.target.files[0])

      worker.onmessage = function(e) {
        setIsLoading(false);
        setResult(e.data);
      }
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
        {result ? (<section className="result">
          <p>Employees with ID numbers {result.employeeAId} and {result.employeeBId} have worked together the longest for a total of {result.totalDaysWorkedTogether} days.</p>
          <p>List of employees {result.employeeAId} and {result.employeeBId} common projects:</p>
          <div className="result__data-grid">
            <div className="result__data-grid__header">Employee ID #1</div>
            <div className="result__data-grid__header">Employee ID #1</div>
            <div className="result__data-grid__header">Project ID</div>
            <div className="result__data-grid__header">Days worked together</div>
            {result.projects.map((project) => (
              <>
                <div>{result.employeeAId}</div>
                <div>{result.employeeBId}</div>
                <div>{project.projectId}</div>
                <div>{project.daysWorkedTogether}</div>
              </>))}
            <div>Total:</div>
            <div>{result.totalDaysWorkedTogether}</div>
          </div>
        </section>) : null}
      </main>
    </div>
  );
}

export default App;
