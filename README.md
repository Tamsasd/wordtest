# WordTest Online

> Vocabulary trainer based on active recall with forced retrieval, featuring uploadable wordlists and timed sessions
> A recreation of my two previous console-based learning apps in a much better online environment.

https://github.com/user-attachments/assets/ac66e653-8767-45e4-9966-968c844dca01

## Features

- **Uploadable lists:** Upload previously typed or extracted data, set the delimiter and the app automatically loads the words for you.
- **Practice Mode:** Learn words by continously recalling them, in any order you like.
- **Exam mode:** Test your knowledge of your words by typing all of them. See the results and practice the incorrect words after.
- **Settings:** Learn in the way _you_ want to, by choosing from the following settings:
  - auto-submit: automatically test the word when the character length is same as the correct answer
  - case-sensitivity: if turned on, uppercase letters will not be accepted where the answer is a lower case letter
  - skip-evaluation: do not show the correct answer after an incorrect guess
  - mode: change between practice and exam mode
  - order: change the order of the words
  - countdown: set a timer to automatically end the session
  - stop-percentage: if a percentage of correct words is reached, end the session
  - colors: toggle between dark and light mode

## Tech Stack

- **Language:** Javascript
- **Frontend:** HTML, CSS

## TODO

- Create an option to learn words in batches
- Implement some sort of a "small shuffle" algorithm that automatically select words based on the user's knowledge

## Acknowledgments

- Monocraft font by IdreesInc: [link](https://github.com/IdreesInc/Monocraft)
