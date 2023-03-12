import React, { useState } from 'react';
import './App.css';
import ResultTable from './ResultTable';
import { CoworkingPairEntry } from './types';

function App() {
  const [result, setResult] = useState<CoworkingPairEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHasError(false);
    setResult(null);

    if (event.target.files && event.target.files.length > 0) {
      const worker = new Worker(new URL("./processCSV.worker.ts", import.meta.url));
      setIsLoading(true);

      worker.postMessage(event.target.files[0])

      worker.onmessage = function(e) {
        if (typeof e.data === "string") {
          setIsLoading(false);
          setHasError(true);
          setResult(null);
        } else {
          setIsLoading(false);
          setResult(e.data);
        }
      }
    } else {
      setHasError(false);
      setResult(null);
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
           disabled={isLoading}
        />
        {isLoading ? <div>
          <p>Loading...</p>
          </div> : null}
        {hasError ? <p>Invalid data. Try uploading a different file.</p> : null}
        {result ? (<section className="result">
          <p>Employees with ID numbers <span className="text-strong">{result.employeeAId}</span> and <span className="text-strong">{result.employeeBId}</span> have worked together the longest for a total of <span className="text-strong">{result.totalDaysWorkedTogether}</span> days.</p>
          <p>List of employees <span className="text-strong">{result.employeeAId}</span> and <span className="text-strong">{result.employeeBId}</span>'s common projects:</p>
          <ResultTable result={result}/>
        </section>) : null}
      </main>
    </div>
  );
}

export default App;
