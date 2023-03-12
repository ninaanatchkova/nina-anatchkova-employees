import { createProjectRecordFromTokens, findLongestCoworkingPair, generateCoworkingPairKey, isRowValid, returnIdsInAscendingOrder, workingPeriodOverlap } from "./process.CSV.utils";
import { CoworkingPairs, EmployeeRecord, ProjectsData } from "./types";

//eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;



ctx.addEventListener("message", (event)=> {
  const data = event.data

  extractProjectDataFromFile(data)
  .then(value => {
    if (value.length === 0 ) {
      throw new Error("Invalid data. Try uploading a different file.")
    }

    const coworkingPairs = findCoworkingPairs(value, {});

    if (Object.keys(coworkingPairs).length === 0) {
      throw new Error("No two employees have worked together on shared projects.")
    }

    const longestCoworkingPair = findLongestCoworkingPair(coworkingPairs)
    postMessage(longestCoworkingPair)})
  .catch(err => {
    console.log(err.message)
    postMessage(err.message)
  });
});


async function extractProjectDataFromFile(file: File) {

  const readableStream = file.stream();
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();

  let unprocessed = '';

  const projects: ProjectsData = [];

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      return projects.filter(n => n);
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
      return acc;
    }

    const coworkingPairKey = generateCoworkingPairKey(currentRecord, record);

    if (acc[coworkingPairKey]) {
      const existingProjectRecordIndex = acc[coworkingPairKey].projects.findIndex((project) => project.projectId === currentRecord.projectId);
      if (existingProjectRecordIndex >= 0) {
        acc[coworkingPairKey].projects[existingProjectRecordIndex].daysWorkedTogether += overlap;
      } else {
        acc[coworkingPairKey].projects.push({projectId: currentRecord.projectId, daysWorkedTogether: overlap});
      }
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

export default null as any;
