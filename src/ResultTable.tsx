import React from 'react';
import { CoworkingPairEntry } from './types';
import './ResultTable.css';

type ResultTableProps = {
  result: CoworkingPairEntry;
}

function ResultTable({result}: ResultTableProps) {
  return (
    <div className="result-table__wrapper">
      <table className="result-table">
        <tr>
          <th>Employee ID #1</th>
          <th>Employee ID #2</th>
          <th>Project ID</th>
          <th>Days worked together</th>
        </tr>
        {result.projects.map((project, projectIndex) => (
          <tr key={projectIndex}>
            <td>{result.employeeAId}</td>
            <td>{result.employeeBId}</td>
            <td>{project.projectId}</td>
            <td>{project.daysWorkedTogether}</td>
          </tr>))}
          <tr>
            <td colSpan={3} className="text-strong">Total:</td>
            <td className="result-table__cell--total text-strong">{result.totalDaysWorkedTogether}</td>
          </tr>
      </table>
    </div>
  )
}

export default ResultTable;