import { Group, Rect, Ellipse, Line } from 'react-konva';

type FurnitureProps = {
  itemKey: string;
  size?: number;
};

export default function Furniture({
  itemKey,
  size = 80,
}: FurnitureProps) {
  const scale = size / 100;

  if (itemKey.toLowerCase().includes('bed')) {
    return (
      <Group scaleX={scale} scaleY={scale}>
        {/* Soft shadow */}
        <Ellipse
          x={50}
          y={84}
          radiusX={43}
          radiusY={8}
          fill="#d8c5d9"
          opacity={0.55}
        />

        {/* Bed frame */}
        <Rect
          x={8}
          y={24}
          width={84}
          height={60}
          cornerRadius={10}
          fill="#b58b76"
        />

        {/* Blanket */}
        <Rect
          x={13}
          y={39}
          width={74}
          height={40}
          cornerRadius={7}
          fill="#f2a9c5"
        />

        {/* Blanket detail */}
        <Line
          points={[20, 66, 80, 66]}
          stroke="#e88db0"
          strokeWidth={2}
        />

        {/* Pillows */}
        <Rect
          x={17}
          y={28}
          width={29}
          height={17}
          cornerRadius={6}
          fill="#fff1f6"
          stroke="#e8c6d5"
          strokeWidth={1}
        />

        <Rect
          x={53}
          y={28}
          width={29}
          height={17}
          cornerRadius={6}
          fill="#fff1f6"
          stroke="#e8c6d5"
          strokeWidth={1}
        />

        {/* Bed feet */}
        <Rect x={13} y={80} width={8} height={7} fill="#8d6658" />
        <Rect x={79} y={80} width={8} height={7} fill="#8d6658" />
      </Group>
    );
  }

  return (
    <Group scaleX={scale} scaleY={scale}>
      <Ellipse
        x={50}
        y={83}
        radiusX={30}
        radiusY={7}
        fill="#d8c5d9"
        opacity={0.5}
      />
      <Rect
        x={15}
        y={15}
        width={70}
        height={68}
        cornerRadius={12}
        fill="#e7c7ed"
        stroke="#c9a4d2"
        strokeWidth={2}
      />
      <Ellipse
        x={50}
        y={40}
        radiusX={17}
        radiusY={17}
        fill="#fff1f6"
      />
    </Group>
  );
}