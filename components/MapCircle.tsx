import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

export const MapCircle = forwardRef((props: google.maps.CircleOptions, ref) => {
  const map = useMap();
  const circle = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!circle.current) {
      circle.current = new google.maps.Circle();
    }
    return () => {
      if (circle.current) {
        circle.current.setMap(null);
      }
    };
  }, []);

  useImperativeHandle(ref, () => circle.current);

  useEffect(() => {
    if (circle.current && map) {
      circle.current.setMap(map);
    }
  }, [map]);

  useEffect(() => {
    if (circle.current) {
      circle.current.setOptions(props);
    }
  }, [props]);

  return null;
});

MapCircle.displayName = 'MapCircle';

