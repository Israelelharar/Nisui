import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Roster from "@/components/Roster";
import Modes from "@/components/Modes";
import About from "@/components/About";
import Footer from "@/components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Roster />
      <Modes />
      <About />
      <Footer />
    </div>
  );
}

export default App;
