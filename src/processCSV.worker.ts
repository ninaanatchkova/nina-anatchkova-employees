import { CoworkingPairs, EmployeeRecord, ProjectsData } from "./types";

//eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

const milisecondsPerDay = 1000 * 60 * 60 * 24;

ctx.addEventListener("message", (event)=> {
  const data = event.data

  extractProjectDataFromFile(data);
})


async function extractProjectDataFromFile(file: File) {

  const readableStream = file.stream();
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();

  let unprocessed = '';

  //
  const projects: ProjectsData = [];

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log('entire file processed');

      const coworkingPairs = findCoworkingPairs(projects, {});

      const longestCoworkingPair = findLongestCoworkingPair(coworkingPairs)

      postMessage(longestCoworkingPair);
      break;
    }

    const decodedChunk = decoder.decode(value);

    let chunkString = unprocessed + decodedChunk;

    unprocessed = '';

    let startIndex = 0;

    for (let ch = startIndex; ch < decodedChunk.length; ch++) {
      if (chunkString[ch] === "\n") {
        let line = chunkString.slice(startIndex, ch);
        startIndex = ch + 1;

        const tokens = line.split(',');

        if (!isRowValid(tokens)) {
          continue; // skip header row or any invalid records
        }

        const projectId = parseInt(tokens[1]);

        if (!projects[projectId]) {
          projects[projectId] = [];
        }

        projects[projectId]?.push(createProjectRecordFromTokens(tokens[0], tokens[1], tokens[2], tokens[3]));
      }
    }

    if (chunkString[chunkString.length - 1] !== '\n') {
      unprocessed = chunkString.slice(startIndex);
    }
  }

}

function isRowValid(tokens: string[]) {
  if (!tokens[0] || !tokens[1] || !tokens[2] || !tokens[3]) {
    return false;
  }

  if (Number.isNaN(parseInt(tokens[0])) || Number.isNaN(parseInt(tokens[1]))) {
    return false;
  }

  if (Number.isNaN(Date.parse(tokens[2]))) {
    return false; 
  }

  if (Number.isNaN(Date.parse(tokens[3])) && tokens[3] !== "NULL") {
    return false;
  }

  return true;
}

function createProjectRecordFromTokens(employeeId: string, projectId: string, startDate: string, endDate:string): EmployeeRecord {
  return {
    employeeId: parseInt(employeeId),
    projectId: parseInt(projectId),
    startDate: Date.parse(startDate),
    endDate: endDate === "NULL" ? Date.now() : Date.parse(endDate)
  }
}

function findCoworkingPairs(projects: ProjectsData, coworkingPairs: CoworkingPairs) {
  return projects.reduce((acc: CoworkingPairs, project: (EmployeeRecord[] | undefined)) => {
    if (!project) {
      return acc;
    }
    return findCoworkingPairsPerProject(project, coworkingPairs)
  }, coworkingPairs)
}

function findCoworkingPairsPerProject(project: EmployeeRecord[], coworkingPairs: CoworkingPairs) {
  coworkingPairs = project.reduce((acc, employeeRecord, employeeRecordIndex) => {
    const followingEmployeeRecords = project.slice(employeeRecordIndex + 1);

    const coworkingPairsWithCurrent = followingEmployeeRecords.reduce(getReducer(employeeRecord), coworkingPairs)
    return {...acc, ...coworkingPairsWithCurrent};
  }, coworkingPairs)

  return coworkingPairs;
}

function getReducer(currentRecord: EmployeeRecord) {
  return function reducer(acc: CoworkingPairs, record: EmployeeRecord) {
    const overlap = workingPeriodOverlap(currentRecord, record);

    if (overlap <= 0) {
      return acc
    }

    const coworkingPairKey = generateCoworkingPairKey(currentRecord, record);

    if (acc[coworkingPairKey]) {
      acc[coworkingPairKey].projects.push({projectId: currentRecord.projectId, daysWorkedTogether: overlap});
      acc[coworkingPairKey].totalDaysWorkedTogether += overlap;
    } else {
      acc[coworkingPairKey] = {
        ... returnIdsInAscendingOrder(currentRecord, record),
        projects: [{projectId: currentRecord.projectId, daysWorkedTogether: overlap}],
        totalDaysWorkedTogether: overlap,
      }
    }

    return acc;
  }
}

function workingPeriodOverlap(employeeA: EmployeeRecord, employeeB: EmployeeRecord) {
  const [firstEmployee, secondEmployee] = employeeA.startDate <= employeeB.startDate ? [employeeA, employeeB] : [employeeB, employeeA];
  
  if (firstEmployee.endDate < secondEmployee.startDate) {
    return 0;
  }

  return Math.ceil((firstEmployee.endDate - secondEmployee.startDate) / milisecondsPerDay);
}

function generateCoworkingPairKey(employeeA: EmployeeRecord, employeeB: EmployeeRecord) {
  return employeeA.employeeId < employeeB.employeeId ? `${employeeA.employeeId}-${employeeB.employeeId}` : `${employeeB.employeeId}-${employeeA.employeeId}`;
}

function returnIdsInAscendingOrder(recordA: EmployeeRecord, recordB: EmployeeRecord) {
  return recordA.employeeId < recordB.employeeId ? {employeeAId: recordA.employeeId, employeeBId: recordB.employeeId} : {employeeAId: recordB.employeeId, employeeBId: recordA.employeeId}
}

function findLongestCoworkingPair(coworkingPairs: CoworkingPairs) {
  const index = Object.entries(coworkingPairs).sort((a, b) => b[1].totalDaysWorkedTogether - a[1].totalDaysWorkedTogether)[0][0];
  return coworkingPairs[index];
} 

export default null as any;
