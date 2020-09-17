// eslint-disable
// this is an auto generated file. This will be overwritten

export const getUserDocumentSets = `query GetUserDocumentSets($id: ID!) {
  getUserDocumentSets(id: $id) {
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
export const listUserDocumentSetss = `query ListUserDocumentSetss(
  $filter: ModeluserDocumentSetsFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserDocumentSetss(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      userID
      documentSetInfo {
        id
        name
        description
      }
    }
    nextToken
  }
}
`;
export const getDocumentSetInfo = `query GetDocumentSetInfo($id: ID!) {
  getDocumentSetInfo(id: $id) {
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
export const listDocumentSetInfos = `query ListDocumentSetInfos(
  $filter: ModeldocumentSetInfoFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocumentSetInfos(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
  }
}
`;
export const getDocumentImage = `query GetDocumentImage($id: ID!) {
  getDocumentImage(id: $id) {
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
export const listDocumentImages = `query ListDocumentImages(
  $filter: ModeldocumentImageFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocumentImages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
  }
}
`;
export const getDocumentStaff = `query GetDocumentStaff($id: ID!) {
  getDocumentStaff(id: $id) {
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
export const listDocumentStaffs = `query ListDocumentStaffs(
  $filter: ModeldocumentStaffFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocumentStaffs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
        calculatedOrientation
        pageBoundaries
        lastPhaseRun
        pageStaffLocations
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
    nextToken
  }
}
`;
export const getTrainingImage = `query GetTrainingImage($id: ID!) {
  getTrainingImage(id: $id) {
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
export const listTrainingImages = `query ListTrainingImages(
  $filter: ModeltrainingImageFilterInput
  $limit: Int
  $nextToken: String
) {
  listTrainingImages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
  }
}
`;
