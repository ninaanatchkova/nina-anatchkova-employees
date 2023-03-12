import { CoworkingPairs, EmployeeRecord } from "./types";
const parser = require('any-date-parser'); 

const millisecondsPerDay = 1000 * 60 * 60 * 24;

export function isRowValid(tokens: string[]) {
  if (!tokens[0] || !tokens[1] || !tokens[2] || !tokens[3]) {
    return false;
  }

  if (Number.isNaN(parseInt(tokens[0])) || Number.isNaN(parseInt(tokens[1]))) {
    return false;
  }

  if (parser.fromString(tokens[2]).invalid) {
    return false; 
  }

  if (parser.fromString(tokens[3]).invalid && tokens[3] !== "NULL") {
    return false;
  }

  return true;
};

export function createProjectRecordFromTokens(employeeId: string, projectId: string, startDate: string, endDate:string): EmployeeRecord {
  return {
    employeeId: parseInt(employeeId),
    projectId: parseInt(projectId),
    startDate: parser.fromString(startDate).getTime(),
    endDate: endDate === "NULL" ? Date.now() : parser.fromString(endDate).getTime()
  }
};

export function workingPeriodOverlap(employeeA: EmployeeRecord, employeeB: EmployeeRecord) {
  const [firstEmployee, secondEmployee] = employeeA.startDate <= employeeB.startDate ? [employeeA, employeeB] : [employeeB, employeeA];
  
  if (firstEmployee.endDate < secondEmployee.startDate) {
    return 0;
  }

  return Math.ceil((firstEmployee.endDate - secondEmployee.startDate) / millisecondsPerDay);
}

export function generateCoworkingPairKey(employeeA: EmployeeRecord, employeeB: EmployeeRecord) {
  return employeeA.employeeId < employeeB.employeeId ? `${employeeA.employeeId}-${employeeB.employeeId}` : `${employeeB.employeeId}-${employeeA.employeeId}`;
}

export function returnIdsInAscendingOrder(recordA: EmployeeRecord, recordB: EmployeeRecord) {
  return recordA.employeeId < recordB.employeeId ? {employeeAId: recordA.employeeId, employeeBId: recordB.employeeId} : {employeeAId: recordB.employeeId, employeeBId: recordA.employeeId}
}

export function findLongestCoworkingPair(coworkingPairs: CoworkingPairs) {
  const index = Object.entries(coworkingPairs).sort((a, b) => b[1].totalDaysWorkedTogether - a[1].totalDaysWorkedTogether)[0][0];
  return coworkingPairs[index];
} 
