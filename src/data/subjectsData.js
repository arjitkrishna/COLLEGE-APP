export const subjectsData = {
  CSE: [
    {
      id: 'cs201',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      faculty: 'Dr. Sharma',
      credits: 4,
    },
    {
      id: 'cs301',
      name: 'Operating Systems',
      code: 'CS301',
      faculty: 'Dr. Patel',
      credits: 4,
    },
    {
      id: 'cs302',
      name: 'Database Management Systems',
      code: 'CS302',
      faculty: 'Dr. Kumar',
      credits: 4,
    },
    {
      id: 'cs303',
      name: 'Computer Networks',
      code: 'CS303',
      faculty: 'Dr. Singh',
      credits: 3,
    },
    {
      id: 'cs304',
      name: 'Theory of Computation',
      code: 'CS304',
      faculty: 'Dr. Gupta',
      credits: 3,
    },
    {
      id: 'cs305',
      name: 'Software Engineering',
      code: 'CS305',
      faculty: 'Dr. Verma',
      credits: 3,
    },
  ],
  DSAI: [
    {
      id: 'da201',
      name: 'Machine Learning',
      code: 'DA201',
      faculty: 'Dr. Reddy',
      credits: 4,
    },
    {
      id: 'da301',
      name: 'Deep Learning',
      code: 'DA301',
      faculty: 'Dr. Rao',
      credits: 4,
    },
    {
      id: 'da302',
      name: 'Data Mining',
      code: 'DA302',
      faculty: 'Dr. Iyer',
      credits: 3,
    },
    {
      id: 'da303',
      name: 'Natural Language Processing',
      code: 'DA303',
      faculty: 'Dr. Nair',
      credits: 4,
    },
    {
      id: 'da304',
      name: 'Computer Vision',
      code: 'DA304',
      faculty: 'Dr. Joshi',
      credits: 3,
    },
    {
      id: 'da305',
      name: 'Statistics & Probability',
      code: 'DA305',
      faculty: 'Dr. Menon',
      credits: 3,
    },
  ],
  ECE: [
    {
      id: 'ec201',
      name: 'Digital Signal Processing',
      code: 'EC201',
      faculty: 'Dr. Das',
      credits: 4,
    },
    {
      id: 'ec301',
      name: 'VLSI Design',
      code: 'EC301',
      faculty: 'Dr. Roy',
      credits: 4,
    },
    {
      id: 'ec302',
      name: 'Embedded Systems',
      code: 'EC302',
      faculty: 'Dr. Mishra',
      credits: 4,
    },
    {
      id: 'ec303',
      name: 'Communication Systems',
      code: 'EC303',
      faculty: 'Dr. Banerjee',
      credits: 3,
    },
    {
      id: 'ec304',
      name: 'Control Systems',
      code: 'EC304',
      faculty: 'Dr. Chatterjee',
      credits: 3,
    },
    {
      id: 'ec305',
      name: 'Microprocessors',
      code: 'EC305',
      faculty: 'Dr. Mukherjee',
      credits: 3,
    },
  ],
};

export const getSubjectsByBranch = (branch) => {
  return subjectsData[branch] || subjectsData.CSE;
};

export default subjectsData;
