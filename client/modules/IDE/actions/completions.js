import apiClient from '../../../utils/apiClient';
import { startLoader, stopLoader } from './loader';
import * as ActionTypes from '../../../constants';

/* eslint-disable import/prefer-default-export */

export function getCompletion(prompt, callback, model = 'gpt-3.5-turbo-0613') {
  return (dispatch, getState) => {
    dispatch(startLoader());
    const state = getState();
    const selected = state.files.find((file) => file.isSelectedFile);
    const { content } = selected;

    const postParams = {
      code: content,
      query: prompt,
      model
    };

    apiClient
      .post('/completions', postParams)
      .then((response) => {
        console.log(response);
        const updatedCode = response.data.code;

        if (typeof callback === 'function') {
          callback(updatedCode);
        }

        dispatch(stopLoader());
      })
      .catch(() => {
        dispatch({
          type: ActionTypes.ERROR
        });
        dispatch(stopLoader());
      });
  };
}
