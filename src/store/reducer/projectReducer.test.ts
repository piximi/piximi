const unknownCategory: Category = {
  description: "Unknown",
  identifier: "00000000-0000-0000-0000-000000000000",
  index: 0,
  visualization: {
    color: "rgb(233, 165, 177)",
    visible: true,
  },
};

const newProjectState: Project = {
  categories: [unknownCategory],
  images: [],
  name: "Untitled classifier",
};

it("createCategoryAction", () => {
  const category: Category = {
    description: "example",
    identifier: "11111111-1111-1111-1111-11111111111",
    index: 1,
    visualization: {
      color: "#FFFFFF",
      visible: true,
    },
  };

  const payload = {
    category: category,
  };

  const action = actions.createCategoryAction(payload);

  const reducer = project.reducer(newProjectState, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("createImageAction", () => {
  const image: Image = {
    categoryIdentifier: "00000000-0000-0000-0000-000000000000",
    checksum: "",
    data: "",
    identifier: "11111111-1111-1111-1111-11111111111",
    partition: Partition.Training,
    scores: [],
    visualization: {
      brightness: 0,
      contrast: 0,
      visible: true,
      visibleChannels: [],
    },
  };

  const payload = {
    identifier: "11111111-1111-1111-1111-11111111111",
    image: image,
  };

  const action = actions.createImageAction(payload);

  const reducer = project.reducer(newProjectState, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("createImagesAction", () => {
  const state: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const images: Image[] = [
    {
      categoryIdentifier: "00000000-0000-0000-0000-000000000000",
      checksum: "",
      data: "",
      identifier: "11111111-1111-1111-2222-11111111111",
      partition: Partition.Training,
      scores: [],
      visualization: {
        brightness: 0,
        contrast: 0,
        visible: true,
        visibleChannels: [],
      },
    },
    {
      categoryIdentifier: "00000000-0000-0000-0000-000000000000",
      checksum: "",
      data: "",
      identifier: "11111111-1111-1111-333-11111111111",
      partition: Partition.Training,
      scores: [],
      visualization: {
        brightness: 0,
        contrast: 0,
        visible: true,
        visibleChannels: [],
      },
    },
  ];

  const payload = {
    images: images,
  };

  const action = actions.createImagesAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-2222-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-333-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("createProjectAction", () => {
  const payload = {
    project: {
      categories: [unknownCategory],
      images: [],
      name: "example",
    },
  };

  const action = actions.createProjectAction(payload);

  const reducer = project.reducer(newProjectState, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [],
    name: "example",
  };

  expect(reducer).toEqual(expected);
});

it("deleteCategoryAction", () => {
  const state: Project = {
    categories: [
      {
        description: "Unknown",
        identifier: "00000000-0000-0000-0000-000000000000",
        index: 0,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "11111111-1111-1111-1111-11111111111",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    category: state.categories[1],
  };

  const action = actions.deleteCategoryAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      {
        description: "Unknown",
        identifier: "00000000-0000-0000-0000-000000000000",
        index: 0,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("deleteImageAction", () => {
  const state: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    image: state.images[0],
  };

  const action = actions.deleteImageAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("openProjectAction", () => {
  const payload = {
    project: {
      categories: [
        unknownCategory,
        {
          description: "1",
          identifier: "18be6295-dade-445e-a13f-e9f2268ac8e6",
          index: 0,
          visualization: {
            color: "#9c27b0",
            visible: true,
          },
        },
        {
          description: "0",
          identifier: "789f08ed-fe80-4785-bdf6-0e7108ec29a3",
          index: 0,
          visualization: {
            color: "#00e676",
            visible: true,
          },
        },
      ],
      images: [
        {
          categoryIdentifier: "00000000-0000-0000-0000-000000000000",
          checksum: "",
          data: "",
          identifier: "11111111-1111-1111-1111-11111111111",
          partition: Partition.Training,
          scores: [],
          visualization: {
            brightness: 0,
            contrast: 0,
            visible: true,
            visibleChannels: [],
          },
        },
      ],
      name: "example",
    },
  };

  const action = actions.openProjectAction(payload);

  const reducer = project.reducer(newProjectState, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "1",
        identifier: "18be6295-dade-445e-a13f-e9f2268ac8e6",
        index: 0,
        visualization: {
          color: "#9c27b0",
          visible: true,
        },
      },
      {
        description: "0",
        identifier: "789f08ed-fe80-4785-bdf6-0e7108ec29a3",
        index: 0,
        visualization: {
          color: "#00e676",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "example",
  };

  expect(reducer).toEqual(expected);
});

it("toggleCategoryVisibilityAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  const payload = {
    category: state.categories[1],
  };

  const action = actions.toggleCategoryVisibilityAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: false,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateCategoryColorAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  const payload = {
    category: state.categories[1],
    color: "#000000",
  };

  const action = actions.updateCategoryColorAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#000000",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateCategoryDescriptionAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  const payload = {
    category: state.categories[1],
    description: "updated",
  };

  const action = actions.updateCategoryDescriptionAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "updated",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateCategoryVisibilityAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  const payload = {
    category: state.categories[1],
    visible: false,
  };

  const action = actions.updateCategoryVisibilityAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: false,
        },
      },
    ],
    images: [],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateImageBrightnessAction", () => {
  const state: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    image: state.images[0],
    brightness: 1,
  };

  const action = actions.updateImageBrightnessAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 1,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateImageCategoryAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    image: state.images[0],
    category: state.categories[1],
  };

  const action = actions.updateImageCategoryAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "11111111-1111-1111-1111-11111111111",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateImageContrastAction", () => {
  const state: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    image: state.images[0],
    contrast: 1,
  };

  const action = actions.updateImageContrastAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 1,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateImagesCategoryAction", () => {
  const state: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-1111-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-3333-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    images: state.images,
    category: state.categories[1],
  };

  const action = actions.updateImagesCategoryAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [
      unknownCategory,
      {
        description: "example",
        identifier: "11111111-1111-1111-1111-11111111111",
        index: 1,
        visualization: {
          color: "#FFFFFF",
          visible: true,
        },
      },
    ],
    images: [
      {
        categoryIdentifier: "11111111-1111-1111-1111-11111111111",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-1111-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "11111111-1111-1111-1111-11111111111",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-2222-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
      {
        categoryIdentifier: "11111111-1111-1111-1111-11111111111",
        checksum: "",
        data: "",
        identifier: "22222222-2222-2222-3333-22222222222",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateImagesVisibilityAction", () => {
  const state: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: true,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  const payload = {
    images: state.images,
    visible: false,
  };

  const action = actions.updateImagesVisibilityAction(payload);

  const reducer = project.reducer(state, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [
      {
        categoryIdentifier: "00000000-0000-0000-0000-000000000000",
        checksum: "",
        data: "",
        identifier: "11111111-1111-1111-1111-11111111111",
        partition: Partition.Training,
        scores: [],
        visualization: {
          brightness: 0,
          contrast: 0,
          visible: false,
          visibleChannels: [],
        },
      },
    ],
    name: "Untitled classifier",
  };

  expect(reducer).toEqual(expected);
});

it("updateProjectNameAction", () => {
  const payload = {
    name: "updated",
  };

  const action = actions.updateProjectNameAction(payload);

  const reducer = project.reducer(newProjectState, action);

  const expected: Project = {
    categories: [unknownCategory],
    images: [],
    name: "updated",
  };

  expect(reducer).toEqual(expected);
});
