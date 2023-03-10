
//eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener("message", (event)=> {
  const data = event.data

  extractProjectDataFromFile(data);

  postMessage('done');
})

type ProjectRecord = {
  employeeId: number;
  projectId: number;
  startDate: Date;
  endDate: Date;
}

async function extractProjectDataFromFile(file: File) {

  const readableStream = file.stream();
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();

  let unprocessed = '';

  const projects: ProjectRecord[][] = [];

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

function createProjectRecordFromTokens(employeeId: string, projectId: string, startDate: string, endDate:string): ProjectRecord {
  return {
    employeeId: parseInt(employeeId),
    projectId: parseInt(projectId),
    startDate: new Date(Date.parse(startDate)),
    endDate: endDate === "NULL" ? new Date() : new Date(Date.parse(endDate))
  }
}

export default null as any;