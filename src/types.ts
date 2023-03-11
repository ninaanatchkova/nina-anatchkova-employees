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
