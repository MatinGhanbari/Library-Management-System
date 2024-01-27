const Book = require('./models/book.js');
const faker = require('faker');
const fs = require('fs');
const path = require('path');

const category = ["Science", "Biology", "Physics", "Chemistry", "Novel", "Travel", "Cooking", "Philosophy", "Mathematics", "Ethics", "Technology"];

const author = [];
for(let i = 0; i < 11; i++) {
    author.push(faker.name.findName());
}

function getImagesInFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']; // Add more extensions if needed

    const imageFiles = files.filter(file => {
        const extension = path.extname(file).toLowerCase();
        return imageExtensions.includes(extension);
    });

    return imageFiles;
}

function readImageAsBase64(imagePath) {
    const image = fs.readFileSync("images/seeder/book_covers/"+imagePath);
    const base64 = Buffer.from(image).toString('base64');
    const extension = path.extname(imagePath).toLowerCase();
    const mimeType = `image/${extension.substr(1)}`;
    return `data:${mimeType};base64,${base64}`;
}

const covers = getImagesInFolder("images/seeder/book_covers/");

async function seed(limit) {
    for(let i = 0; i < 11; i++) {
        author.push(faker.name.findName());
    }
    for(let i = 0; i < limit; i++) {
        let index1 = Math.floor(Math.random() * Math.floor(11));
        let index2 = Math.floor(Math.random() * Math.floor(11));
        let index3 = Math.floor(Math.random() * Math.floor(13));
        try {
            const book = new Book({
                title: faker.lorem.words(),
                ISBN: faker.random.uuid(),
                cover: readImageAsBase64(covers[index3]),
                late_fee: 10,
                stock: 10,
                author: author[index2],
                description: faker.lorem.paragraphs(3),
                category: category[index1],
            });
            await book.save();
        } catch(err) {
            console.log(err);
            console.log("Error at creating books");
            break;
        }
    }
}

module.exports = seed;