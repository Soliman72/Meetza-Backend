/**
 * Each group includes its leader (`admin`). That user is created as
 * `Administrator` and linked via `group_admin` (OWNER) when seeds run.
 *
 * Optional on each admin: `position_title` or `position` — creates a row in `position` if absent.
 * Optional on each group: `group_content_name`, `group_content_description` — default content uses
 * `${group_name} Content` and group `description` when omitted.
 */
module.exports = [
  {
    group_name: "COMP 402",
    description: "Bioinformatics",
    year: "4",
    semester: "Spring",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Mohamed Hashem",
      email: "Mohamedhashim@gmail.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP 404",
    description: "Software Engineering",
    year: "4",
    semester: "Spring",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Hussein Karam",
      email: "Husseinkaram@gmual.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP 408",
    description: "Advanced AI",
    year: "4",
    semester: "Spring",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admins: [
      {
        name: "Azza",
        email: "Azza@gmail.com",
        role: "Administrator",
      },
      {
        name: "Howayda",
        email: "howayda@gmail.com",
        role: "Administrator",
      },
    ],
  },
  {
    group_name: "COMP 416",
    description: "Data Mining",
    year: "4",
    semester: "Spring",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Dawlat Abdelaziz",
      email: "dawlatAbdelAziz@gmail.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP 401",
    description: "AI",
    year: "4",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Azza",
      email: "Azza@gmail.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP 403",
    description: "Image Processing",
    year: "4",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Howayda",
      email: "howayda@gmail.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP 411",
    description: "Geometry",
    year: "4",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Ghada",
      email: "Ghada@gmail.com",
      role: "Administrator",
    },
  },
  {
    group_name: "COMP309",
    description: "Multimedia",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Hussein Karam",
      email: "Husseinkaram@gmual.com",
      role: "Administrator",
      user_photo: "",
    },
  },
  {
    group_name: "COMP307",
    description: "Operating Systems",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Mohamed Hashem",
      email: "Mohamedhashim@gmail.com",
      role: "Administrator",
      user_photo: "",
    },
  },
  {
    group_name: "COMP305",
    description: "Complexity",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Azza",
      email: "Azza@gmail.com",
      role: "Administrator",
      user_photo: "",
    },
  },
  {
    group_name: "COMP303",
    description: "Syntax",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Dawlat Abdelaziz",
      email: "dawlatAbdelAziz@gmail.com",
      role: "Administrator",
      user_photo: "",
    },
  },
  {
    group_name: "COMP301",
    description: "Java Programming",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg",
    admin: {
      name: "Nashwa Abdulaziz",
      email: "NashwaAbdulaziz@gmail.com",
      role: "Administrator",
      user_photo: "",
    },
  },
  {
    group_name: "Graduation Project",
    description: "Graduation Project",
    year: "3",
    semester: "Fall",
    group_photo: "https://res.cloudinary.com/dax2irx1f/image/upload/v1777042990/posters/wx2zdsabizb7kbdjsmpz.jpg",
    admin: {
      name: "Mohamed Mostafa",
      email: "MohamedMostafa@gmail.com",
      role: "Administrator",
      user_photo: "",
    },
  },
];
