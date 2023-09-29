import styled from "styled-components";

export const Wrapper = styled.div`
  /* max-width: var(--maxWidth); */
  max-width: 70%;
  margin: 0 auto;
  padding: 0 100px;

  h1 {
    color: var(--medGray);
    font-family: "Lexend Deca", sans-serif;
    font-weight: 200;
  }
`;

export const Content = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto;
  grid-gap: 1rem;
`;

export const Content2 = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 1rem;
`;
