// eslint-disable
// this is an auto generated file. This will be overwritten

export const createUserDocumentSets = `mutation CreateUserDocumentSets($input: CreateUserDocumentSetsInput!) {
  createUserDocumentSets(input: $input) {
    id
    userID
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
  }
}
`;
export const updateUserDocumentSets = `mutation UpdateUserDocumentSets($input: UpdateUserDocumentSetsInput!) {
  updateUserDocumentSets(input: $input) {
    id
    userID
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
  }
}
`;
export const deleteUserDocumentSets = `mutation DeleteUserDocumentSets($input: DeleteUserDocumentSetsInput!) {
  deleteUserDocumentSets(input: $input) {
    id
    userID
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
  }
}
`;
export const createDocumentSetInfo = `mutation CreateDocumentSetInfo($input: CreateDocumentSetInfoInput!) {
  createDocumentSetInfo(input: $input) {
    id
    name
    description
    users {
      items {
        id
        userID
      }
      nextToken
    }
    images {
      items {
        id
        imageName
        smallImage
        mediumImage
        largeImage
        documentSetId
        calculatedOrientation
        pageBoundaries
        lastPhaseRun
        pageStaffLocations
      }
      nextToken
    }
  }
}
`;
export const updateDocumentSetInfo = `mutation UpdateDocumentSetInfo($input: UpdateDocumentSetInfoInput!) {
  updateDocumentSetInfo(input: $input) {
    id
    name
    description
    users {
      items {
        id
        userID
      }
      nextToken
    }
    images {
      items {
        id
        imageName
        smallImage
        mediumImage
        largeImage
        documentSetId
        calculatedOrientation
        pageBoundaries
        lastPhaseRun
        pageStaffLocations
      }
      nextToken
    }
  }
}
`;
export const deleteDocumentSetInfo = `mutation DeleteDocumentSetInfo($input: DeleteDocumentSetInfoInput!) {
  deleteDocumentSetInfo(input: $input) {
    id
    name
    description
    users {
      items {
        id
        userID
      }
      nextToken
    }
    images {
      items {
        id
        imageName
        smallImage
        mediumImage
        largeImage
        documentSetId
        calculatedOrientation
        pageBoundaries
        lastPhaseRun
        pageStaffLocations
      }
      nextToken
    }
  }
}
`;
export const createDocumentImage = `mutation CreateDocumentImage($input: CreateDocumentImageInput!) {
  createDocumentImage(input: $input) {
    id
    imageName
    smallImage
    mediumImage
    largeImage
    documentSetId
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
    calculatedOrientation
    pageBoundaries
    lastPhaseRun
    pageStaffLocations
    staffs {
      items {
        id
        pageNum
        staffNum
        pointsOfInterest
        guides
        x
        y
        width
        height
        symbols
        voice
        bookend
        documentId
      }
      nextToken
    }
  }
}
`;
export const updateDocumentImage = `mutation UpdateDocumentImage($input: UpdateDocumentImageInput!) {
  updateDocumentImage(input: $input) {
    id
    imageName
    smallImage
    mediumImage
    largeImage
    documentSetId
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
    calculatedOrientation
    pageBoundaries
    lastPhaseRun
    pageStaffLocations
    staffs {
      items {
        id
        pageNum
        staffNum
        pointsOfInterest
        guides
        x
        y
        width
        height
        symbols
        voice
        bookend
        documentId
      }
      nextToken
    }
  }
}
`;
export const deleteDocumentImage = `mutation DeleteDocumentImage($input: DeleteDocumentImageInput!) {
  deleteDocumentImage(input: $input) {
    id
    imageName
    smallImage
    mediumImage
    largeImage
    documentSetId
    documentSetInfo {
      id
      name
      description
      users {
        nextToken
      }
      images {
        nextToken
      }
    }
    calculatedOrientation
    pageBoundaries
    lastPhaseRun
    pageStaffLocations
    staffs {
      items {
        id
        pageNum
        staffNum
        pointsOfInterest
        guides
        x
        y
        width
        height
        symbols
        voice
        bookend
        documentId
      }
      nextToken
    }
  }
}
`;
export const createDocumentStaff = `mutation CreateDocumentStaff($input: CreateDocumentStaffInput!) {
  createDocumentStaff(input: $input) {
    id
    pageNum
    staffNum
    documentImage {
      id
      imageName
      smallImage
      mediumImage
      largeImage
      documentSetId
      documentSetInfo {
        id
        name
        description
      }
      calculatedOrientation
      pageBoundaries
      lastPhaseRun
      pageStaffLocations
      staffs {
        nextToken
      }
    }
    pointsOfInterest
    guides
    x
    y
    width
    height
    symbols
    voice
    bookend
    documentId
  }
}
`;
export const updateDocumentStaff = `mutation UpdateDocumentStaff($input: UpdateDocumentStaffInput!) {
  updateDocumentStaff(input: $input) {
    id
    pageNum
    staffNum
    documentImage {
      id
      imageName
      smallImage
      mediumImage
      largeImage
      documentSetId
      documentSetInfo {
        id
        name
        description
      }
      calculatedOrientation
      pageBoundaries
      lastPhaseRun
      pageStaffLocations
      staffs {
        nextToken
      }
    }
    pointsOfInterest
    guides
    x
    y
    width
    height
    symbols
    voice
    bookend
    documentId
  }
}
`;
export const deleteDocumentStaff = `mutation DeleteDocumentStaff($input: DeleteDocumentStaffInput!) {
  deleteDocumentStaff(input: $input) {
    id
    pageNum
    staffNum
    documentImage {
      id
      imageName
      smallImage
      mediumImage
      largeImage
      documentSetId
      documentSetInfo {
        id
        name
        description
      }
      calculatedOrientation
      pageBoundaries
      lastPhaseRun
      pageStaffLocations
      staffs {
        nextToken
      }
    }
    pointsOfInterest
    guides
    x
    y
    width
    height
    symbols
    voice
    bookend
    documentId
  }
}
`;
export const createTrainingImage = `mutation CreateTrainingImage($input: CreateTrainingImageInput!) {
  createTrainingImage(input: $input) {
    id
    image
    page
    staff
    location
    pitch
    filename
    value
    hidden
  }
}
`;
export const updateTrainingImage = `mutation UpdateTrainingImage($input: UpdateTrainingImageInput!) {
  updateTrainingImage(input: $input) {
    id
    image
    page
    staff
    location
    pitch
    filename
    value
    hidden
  }
}
`;
export const deleteTrainingImage = `mutation DeleteTrainingImage($input: DeleteTrainingImageInput!) {
  deleteTrainingImage(input: $input) {
    id
    image
    page
    staff
    location
    pitch
    filename
    value
    hidden
  }
}
`;
