export default function Footer() {
  return (
    <footer
      className="py-4 text-center font-inter"
      style={{
        fontSize: 13,
        color: '#29445A',
        opacity: 0.5,
      }}
    >
      Dagbesteding EmotieCheck &copy; {new Date().getFullYear()}
    </footer>
  );
}
