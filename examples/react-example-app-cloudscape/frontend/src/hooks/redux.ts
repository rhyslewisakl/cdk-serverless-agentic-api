import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { type RootState, type AppDispatch } from '../store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;