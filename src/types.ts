// to simplify iterating over the data structure, all project data will be stored in an array,
// in which the index of the array member corresponds to the id of the project
// in case there is no data about a project with certain ids, there will be empty members in the array
export type ProjectsData = (EmployeeRecord[] | undefined)[];

export type EmployeeRecord = {
  employeeId: number;
  projectId: number;
  startDate: number;
  endDate: number;
}

export type CoworkingPairEntry = {
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

export type CoworkingPairs = {
  [key: string]: CoworkingPairEntry;
};
