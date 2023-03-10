
//eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

const milisecondsPerDay = 1000 * 60 * 60 * 24;

ctx.addEventListener("message", (event)=> {
  const data = event.data

  extractProjectDataFromFile(data);

  postMessage('done');
})

type EmployeeRecord = {
  employeeId: number;
  projectId: number;
  startDate: number;
  endDate: number;
}

type CoworkingPairEntry = {
  employeeAId: number,
  employeeBId: number,
  projects: [
    {
      projectId: number,
      daysWorkedTogether: number,
    }
  ],
  totalDaysWorkedTogether: number;
};

type CoworkingPairs = {
  [key: string]: CoworkingPairEntry;
};

async function extractProjectDataFromFile(file: File) {

  const readableStream = file.stream();
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();

  let unprocessed = '';

  const projects: EmployeeRecord[][] = [];

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      console.log('entire file processed');
      console.log(projects);
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

        if(!projects[projectId]) {
          projects[projectId] = [];
        }

        projects[projectId].push(createProjectRecordFromTokens(tokens[0], tokens[1], tokens[2], tokens[3]))
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

function findCoworkingPairs(project: EmployeeRecord[]) {
  const coworkingPairs: CoworkingPairs = {};

  for (let i = 0; i < project.length; i++) {
    const currentEmployee = project[i];
    const restOfEmployees = project.slice(i + 1);

    restOfEmployees.reduce(getReducer(currentEmployee), {})
  }
}

function getReducer(currentEmployee: EmployeeRecord) {
  function reducer(coworkingPairs: CoworkingPairs, employeeRecord: EmployeeRecord) {
    const overlap = workingPeriodOverlap(currentEmployee, employeeRecord);
    if (overlap > 0) {
      const coworkingPairKey = currentEmployee.employeeId < employeeRecord.employeeId ? `${currentEmployee}-${employeeRecord.employeeId}` : `${employeeRecord.employeeId}-${currentEmployee}`;
      
      if (!coworkingPairs[coworkingPairKey]) {
        coworkingPairs[coworkingPairKey] = {
          employeeAId: currentEmployee.employeeId < employeeRecord.employeeId ? currentEmployee.employeeId : employeeRecord.employeeId,
          employeeBId: currentEmployee.employeeId < employeeRecord.employeeId ? employeeRecord.employeeId : currentEmployee.employeeId,
          projects: [{projectId: currentEmployee.projectId, daysWorkedTogether: overlap}],
          totalDaysWorkedTogether: overlap,
        }
      }

      coworkingPairs[coworkingPairKey].projects.push({projectId: currentEmployee.projectId, daysWorkedTogether: overlap});
      coworkingPairs[coworkingPairKey].totalDaysWorkedTogether += overlap;
    }

    return coworkingPairs;
  }
  return reducer;
}

function workingPeriodOverlap(employeeA: EmployeeRecord, employeeB: EmployeeRecord) {
  const [firstEmployee, secondEmployee] = employeeA.startDate <= employeeB.startDate ? [employeeA, employeeB] : [employeeB, employeeA];
  
  if (firstEmployee.endDate < secondEmployee.startDate) {
    return 0;
  }

  return Math.ceil((firstEmployee.endDate - secondEmployee.startDate) / milisecondsPerDay);
}

export default null as any;