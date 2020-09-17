// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateUserDocumentSets = `subscription OnCreateUserDocumentSets {
  onCreateUserDocumentSets {
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
export const onUpdateUserDocumentSets = `subscription OnUpdateUserDocumentSets {
  onUpdateUserDocumentSets {
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
export const onDeleteUserDocumentSets = `subscription OnDeleteUserDocumentSets {
  onDeleteUserDocumentSets {
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
export const onCreateDocumentSetInfo = `subscription OnCreateDocumentSetInfo {
  onCreateDocumentSetInfo {
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
export const onUpdateDocumentSetInfo = `subscription OnUpdateDocumentSetInfo {
  onUpdateDocumentSetInfo {
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
export const onDeleteDocumentSetInfo = `subscription OnDeleteDocumentSetInfo {
  onDeleteDocumentSetInfo {
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
export const onCreateDocumentImage = `subscription OnCreateDocumentImage {
  onCreateDocumentImage {
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
export const onUpdateDocumentImage = `subscription OnUpdateDocumentImage {
  onUpdateDocumentImage {
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
export const onDeleteDocumentImage = `subscription OnDeleteDocumentImage {
  onDeleteDocumentImage {
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
export const onCreateDocumentStaff = `subscription OnCreateDocumentStaff {
  onCreateDocumentStaff {
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
export const onUpdateDocumentStaff = `subscription OnUpdateDocumentStaff {
  onUpdateDocumentStaff {
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
export const onDeleteDocumentStaff = `subscription OnDeleteDocumentStaff {
  onDeleteDocumentStaff {
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
export const onCreateTrainingImage = `subscription OnCreateTrainingImage {
  onCreateTrainingImage {
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
export const onUpdateTrainingImage = `subscription OnUpdateTrainingImage {
  onUpdateTrainingImage {
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
export const onDeleteTrainingImage = `subscription OnDeleteTrainingImage {
  onDeleteTrainingImage {
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
