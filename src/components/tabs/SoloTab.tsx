import ColorsTab from "@/components/ColorsTab";
import { colorPalettes } from "@/data/colors";

const SoloTab = () => <ColorsTab palette={colorPalettes.default} swatchMode="solo" />;

export default SoloTab;
