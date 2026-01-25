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
      username: admin-sk
    #   # Show a call-to-action button under your biography? (optional)
    #   button:
    #     text: Schôdzka - rezervuj si 15 minút online
    #     url: uploads/resume.pdf
    design:
      banner:
        # Upload your cover image to the `assets/media/` folder and reference it here
        filename: kalen-emsley-Bkci_8qcdvQ-unsplash.jpg  #  IMG_4614.JPG
      biography:
        # Customize the style of your biography text
        style: 'text-align: center; font-size: 0.8em;'
      # Avatar customization
      avatar:
        size: medium # Options: small (150px), medium (200px, default), large (320px), xl (400px), xxl (500px)
        shape: rounded # Options: circle (default), square, rounded
  - block: motto
    content:
      title: "Tvoja autenticita je dôležitá"
      text: To najviac čo môžeme svetu dať je naplno sa prejaviť. Vo všetkom, čo robíme. Po svojom. Máme to v sebe. Niekedy sme pripravení a odvážni, niekedy nie. Chýbajú nám zdroje. Kouč môže pomôcť ich nájsť.
      link: /about
      name: "Môj príbeh"
  - block: clients
    content:
      title: "Klienti"
      items:
        - name: "uLékaře.cz"
          logo: "ulekare-logo.svg"
        - name: "Siemens Healthineers"
          logo: "siemens-healthineers-logo.png"
        - name: "Make"
          logo: "make-logo.png"
        - name: "Tietoevry"
          logo: "tietoevry-logo.png"
  # - block: experience
  #   content:
  #     username: admin
  #   design:
  #     # Hugo date format
  #     date_format: 'January 2006'
  #     # Education or Experience section first?
  #     is_education_first: false
  # - block: skills
  #  content:
  #    title: Skills & Hobbies
  #    username: admin-sk
  # - block: awards
  #   content:
  #     title: Awards
  #     username: admin
  # - block: languages
  #   content:
  #     title: Languages
  #     username: admin
---
