---
title: 'Home'
date: 2023-10-24
type: landing

design:
  # Default section spacing
  spacing: "4rem"

# Note: `username` refers to the user's folder name in `content/authors/`

# Page sections
sections:
  - block: biography
    content:
      username: admin-en
      # Show a call-to-action button under your biography? (optional)
#       button:
#         text: Download
#         url: uploads/resume.pdf
    design:
      banner:
        # Upload your cover image to the `assets/media/` folder and reference it here
        filename: kalen-emsley-Bkci_8qcdvQ-unsplash.jpg  #  IMG_4614.JPG
      biography:
        # Customize the style of your biography text
        style: 'text-align: center; font-size: 0.8em;'
      avatar:
        size: medium # Options: small (150px), medium (200px, default), large (320px), xl (400px), xxl (500px)
        shape: rounded # Options: circle (default), square, rounded
  - block: motto
    content:
      title: "Your authenticity is important"
      text: The most we can give to the world is to express ourselves fully. In everything we do. In our own way. We have it within us. Sometimes we are ready and brave, sometimes not. We lack resources. A coach can help find them.
      link: /about
      name: "My Story"
  - block: clients
    content:
      title: "Clients"
      items:
        - name: "uLékaře.cz"
          logo: "ulekare-logo.svg"
        - name: "Siemens Healthineers"
          logo: "siemens-healthineers-logo.png"
        - name: "Make"
          logo: "make-logo.png"
        - name: "Tietoevry"
          logo: "tietoevry-logo.png"
#   - block: experience
#     content:
#       username: admin
#     design:
#       # Hugo date format
#       date_format: 'January 2006'
#       # Education or Experience section first?
#       is_education_first: false
#   - block: skills
#     content:
#       title: Skills & Hobbies
#       username: admin
#   - block: awards
#     content:
#       title: Awards
#       username: admin
#   - block: languages
#     content:
#       title: Languages
#       username: admin
---
