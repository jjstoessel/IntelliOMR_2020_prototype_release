import MeiRenderer from "./meiRenderer";

class MeiDocumentRenderer {
  findStartStaff(documentItems, selectedImage, selectedPage, documentId) {
    for (var i = 0; i < documentItems.length; i++) {
      let item = documentItems[i];
      /*if (
        item.id === selectedImage &&
        item.pageNum === selectedPage &&
        item.bookend === "start" &&
        item.documentId === documentId
      ) {
        return i;
      }*/
      if (item.id === selectedImage && item.pageNum === selectedPage) {
        // iterate through bookmarksif (staff.bookend)
        if (item.bookend)
          try {
            let bookends = JSON.parse(item.bookend);
            for (let pos in bookends) {
              let be = bookends[pos];
              if (be.type === "start" && be.id === documentId) {
                return {
                  itemPos: i,
                  location: pos,
                  voice: item.voice,
                };
              }
            }
          } catch (e) {}
      }
    }

    return null;
  }

  createSortedBookends(bookends) {
    let items = [];
    for (let pos in bookends) {
      let be = bookends[pos];
      items.push({
        pos: pos,
        type: be.type,
        id: be.id,
      });
    }
    function compare(a, b) {
      if (a.pos > b.pos) return 1;
      if (b.pos > a.pos) return -1;
      return 0;
    }

    // lets sort in terms of index and position
    items.sort(compare);
    return items;
  }

  findEndStaff(documentItems, start) {
    for (var i = start.itemPos; i < documentItems.length; i++) {
      let item = documentItems[i];
      if (item.bookend)
        try {
          let bookends = JSON.parse(item.bookend);
          bookends = this.createSortedBookends(bookends);
          for (let y = 0; y < bookends.length; y++) {
            let be = bookends[y];
            if (i === start.itemPos && be.pos <= start.location) continue; // ignore it if it comes before the start
            if (be.type === "end") {
              return {
                itemPos: i,
                location: be.pos,
                voice: item.voice,
              };
            }
            if (be.type === "start") {
              return null;
            }
          }
          /*for (let pos in bookends) {
          let be = bookends[pos];
          if (be.type === "start" && be.id === documentId) {
            return {
              itemPos: i,
              location: pos
            };
          }
        }*/
        } catch (e) {}

      //if (item.bookend === "end") return i;
      //if (item.bookend === "start") return -1;
    }
    return null;
  }

  sortDocumentItems(documentItems) {
    // this sorts the data into individual staffs, sorted
    let sortedItems = [];
    for (let i = 0; i < documentItems.length; i++) {
      let documentItem = documentItems[i];
      let documentId = documentItem.id;
      let numberOfPages = documentItem.pageBoundaries.length;

      for (let page = 0; page < numberOfPages; page++) {
        let locations = documentItem.pageStaffLocations[page]; //.staffLocations.length;
        if (locations) {
          let numberOfStaffs = locations.staffLocations.length;

          for (let staff = 0; staff < numberOfStaffs; staff++) {
            let staffInfo = documentItem.staffs[page + "_" + staff];

            sortedItems.push({
              id: documentId,
              documentIndex: i,
              pageNum: page,
              staffNum: staff,
              pointsOfInterest: staffInfo.pointsOfInterest,
              symbols: staffInfo.symbols,
              voice: staffInfo.voice,
              bookend: staffInfo.bookend,
              //documentId: staffInfo.documentId
            });
          }
        }
      }
    }

    return sortedItems;
  }

  checkVoices(documentItems, start, end) {
    for (let i = start; i <= end; i++) {
      if (!documentItems[i].voice === null) return false;
    }
    return true;
  }

  async processDocument(
    selectedImage,
    selectedPage,
    documentItems,
    documentId
  ) {
    let sortedDocumentItems = this.sortDocumentItems(documentItems);

    let startStaff = this.findStartStaff(
      sortedDocumentItems,
      selectedImage,
      selectedPage,
      documentId
    );
    //alert("staffStart info = " + JSON.stringify(startStaff));
    if (startStaff === null) {
      return {
        error: "no start of document found on this page",
      };
    }
    if (startStaff.voice !== 1) {
      return {
        error: "the start needs to be on the first voice!",
      };
    }
    let endStaff = this.findEndStaff(sortedDocumentItems, startStaff);
    //alert("endStart info = " + JSON.stringify(endStaff));
    if (endStaff === null) {
      return {
        error: "no matching end of document found",
      };
    }

    let voicesMarked = this.checkVoices(
      sortedDocumentItems,
      startStaff.itemPos,
      endStaff.itemPos
    );
    if (!voicesMarked) return { error: "not all voices have been tagged!" };

    let clippedDocumentItems = [];
    for (var i = startStaff.itemPos; i <= endStaff.itemPos; i++)
      clippedDocumentItems.push(sortedDocumentItems[i]);
    return MeiRenderer.renderScore(
      clippedDocumentItems,
      documentId,
      startStaff.location,
      endStaff.location
    );
  }
}

export default new MeiDocumentRenderer();
