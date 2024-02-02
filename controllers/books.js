const Book = require("../models/book");
const IssueRequest = require("../models/issueRequests");
const PER_PAGE = 16;

exports.getBooks = async (req, res, next) => {
  var page = req.params.page || 1;
  const filter = req.params.filter;
  const value = req.params.value;
  let searchObj = {};

  // constructing search object
  if (filter != "all" && value != "all") {
    // fetch books by search value and filter
    searchObj[filter] = value;
  }

  try {
    // Fetch books from database
    const books = await Book.find(searchObj)
      .skip(PER_PAGE * page - PER_PAGE)
      .limit(PER_PAGE);

    const issues = await IssueRequest.find({});

    // Get the count of total available book of given filter
    const count = await Book.find(searchObj).countDocuments();

    res.render("books", {
      books: books,
      issues: issues,
      current: page,
      pages: Math.ceil(count / PER_PAGE),
      filter: filter,
      value: value,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.findBooks = async (req, res, next) => {
  try {
    var page = req.params.page || 1;
    const filter = req.body.filter.toLowerCase();
    const value = req.body.searchName.trim();

    // show flash message if empty search field is sent to backend
    if (value == "") {
      req.flash(
        "error",
        "Search field is empty. Please fill the search field in order to get a result"
      );
      return res.redirect("back");
    }

    const searchObj = {};
    if (filter != "stock") searchObj[filter] = { $regex: value, $options: "i" };
    else searchObj[filter] = value;

    // Fetch books from database
    const books = await Book.find(searchObj)
      .skip(PER_PAGE * page - PER_PAGE)
      .limit(PER_PAGE);

    // Get the count of total available book of given filter
    const count = await Book.find(searchObj).countDocuments();
    const issues = await IssueRequest.find({});

    res.render("books", {
      books: books,
      issues: issues,
      current: page,
      pages: Math.ceil(count / PER_PAGE),
      filter: filter,
      value: value,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
  }
};

// find book details working procedure
/*
   1. fetch book from db by id
   2. populate book with associated comments
   3. render user/bookDetails template and send the fetched book
*/

exports.getBookDetails = async (req, res, next) => {
  try {
    const book_id = req.params.book_id;
    const book = await Book.findById(book_id).populate("comments");
    res.render("user/bookDetails", { book: book });
  } catch (err) {
    console.log(err);
    return res.redirect("back");
  }
};

exports.autocompleteSearch = async (req, res) => {
  try {
    const { filter, q: searchTerm } = req.query;
    let searchQuery = {};

    // Check if the search term is provided
    if (searchTerm) {
      // Handle different filters
      switch (filter) {
        case "Title":
          searchQuery = { title: { $regex: searchTerm, $options: "i" } };
          break;
        case "Author":
          searchQuery = { author: { $regex: searchTerm, $options: "i" } };
          break;
        case "Category":
          searchQuery = { category: { $regex: searchTerm, $options: "i" } };
          break;
        case "ISBN":
          searchQuery = { ISBN: { $regex: searchTerm, $options: "i" } };
          break;
        case "Stock":
          // Assuming stock is a numeric field, you may want to handle it differently
          // For example, you might want to find books with stock greater than a certain number
          // or convert searchTerm to a number and compare
          break;
        default:
          // Default case if no filter is specified or the filter is not recognized
          searchQuery = { title: { $regex: searchTerm, $options: "i" } };
      }
    }

    const results = await Book.find(searchQuery).limit(10); // Limit the number of results to 10

    // Prepare the response based on the filter
    let response = results.map((book) => {
      switch (filter) {
        case "Title":
          return {
            _id: book._id,
            data: book.title,
          };
        case "Author":
          return { data: book.author };
        case "Category":
          return { data: book.category };
        case "ISBN":
          return { data: book.ISBN };
        case "Stock":
          // Assuming you want to return the stock count
          return book.stock.toString();
        default:
          return book.title;
      }
    });
    const uniqueResponse = response.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.data === value.data && t._id === value._id)
    );
    res.json(uniqueResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};
