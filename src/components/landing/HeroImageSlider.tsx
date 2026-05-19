import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "../ui/carousel";
import { Button } from "../ui/button";

export type HeroSlideImage = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
};

const DEFAULT_SLIDES: HeroSlideImage[] = [
  {
    id: "global",
    image: "https://picsum.photos/seed/scholariq-campus/1400/520",
    title: "Study at Top Universities",
    subtitle: "Explore funded programs across the UK, Europe, and beyond.",
  },
  {
    id: "research",
    image: "https://picsum.photos/seed/scholariq-research/1400/520",
    title: "Fully Funded Research",
    subtitle: "PhD and Master's scholarships matched to your academic profile.",
  },
  {
    id: "community",
    image: "https://picsum.photos/seed/scholariq-students/1400/520",
    title: "Join Global Scholars",
    subtitle: "Thousands of students trust ScholarIQ to find real opportunities.",
  },
];

type HeroImageSliderProps = {
  slides?: HeroSlideImage[];
};

export function HeroImageSlider({ slides = DEFAULT_SLIDES }: HeroImageSliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setActive(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api) return;
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [api]);

  return (
    <div className="relative w-full max-w-6xl mx-auto group">
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} className="w-full">
        <CarouselContent className="ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0 basis-full">
              <div className="relative h-[220px] sm:h-[280px] md:h-[340px] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f4a]/90 via-[#1e3a8a]/35 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
                    ScholarIQ Highlights
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold mb-1">{slide.title}</h3>
                  <p className="text-sm md:text-base text-blue-100 max-w-xl">{slide.subtitle}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => api?.scrollPrev()}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 text-[#1e3a8a]" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => api?.scrollNext()}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 hover:bg-white border-0 shadow-lg opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 text-[#1e3a8a]" />
        </Button>
      </Carousel>

      <div className="flex justify-center gap-2 mt-4">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => api?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-[#1e3a8a]" : "w-2 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
