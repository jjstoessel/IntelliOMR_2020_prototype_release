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
    }
  }
  `;

export const getDocumentImageStaffs = `query GetDocumentImage($id: ID!) {
    getDocumentImage(id: $id) {
      id
      imageName
      smallImage
      mediumImage
      largeImage
      calculatedOrientation
      pageBoundaries
      lastPhaseRun
      pageStaffLocations
      staffs(limit:500) {        
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
          }                
        nextToken
      }
    }
  }
  `;

export const getDocumentImageStaffIds = `query GetDocumentImage($id: ID!) {
    getDocumentImage(id: $id) {
      id
      staffs(limit:200) {
        items {
          id
          symbols
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
        
        calculatedOrientation
        pageBoundaries
        lastPhaseRun
        pageStaffLocations
        staffs(limit:500) {        
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
      nextToken
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

export const getDocumentImage = `query GetDocumentImage($id: ID!) {
    getDocumentImage(id: $id) {
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
        }
        nextToken
      }
    }
  }
  `;

export const getDocumentSetThumbnails = `query GetDocumentSetInfo($id: ID!) {
    getDocumentSetInfo(id: $id) {
      id
      images(limit:1000) {
        items {
          id
          imageName
          smallImage
          mediumImage
          largeImage
          lastPhaseRun         
        }
        nextToken
      }
    }
  }
  `;
