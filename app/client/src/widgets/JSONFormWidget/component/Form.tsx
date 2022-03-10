import equal from "fast-deep-equal/es6";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import styled from "styled-components";
import { cloneDeep, debounce, isEmpty } from "lodash";
import { FormProvider, useForm } from "react-hook-form";
import { Text } from "@blueprintjs/core";

import useFixedFooter from "./useFixedFooter";
import {
  BaseButton as Button,
  ButtonStyleProps,
} from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import { FORM_PADDING_Y, FORM_PADDING_X } from "./styleConstants";
import { ROOT_SCHEMA_KEY, Schema } from "../constants";
import { schemaItemDefaultValue } from "../helper";
import { TEXT_SIZES } from "constants/WidgetConstants";

export type FormProps<TValues = any> = PropsWithChildren<{
  backgroundColor?: string;
  disabledWhenInvalid?: boolean;
  fixedFooter: boolean;
  getFormData: () => TValues;
  hideFooter: boolean;
  isSubmitting: boolean;
  onSubmit: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  registerResetObserver: (callback: () => void) => void;
  resetButtonStyles: ButtonStyleProps;
  schema?: Schema;
  scrollContents: boolean;
  showReset: boolean;
  stretchBodyVertically: boolean;
  submitButtonStyles: ButtonStyleProps;
  title: string;
  unregisterResetObserver: () => void;
  updateFormData: (values: TValues) => void;
}>;

type StyledFormProps = {
  scrollContents: boolean;
};

type StyledFormBodyProps = {
  stretchBodyVertically: boolean;
};

type StyledFooterProps = {
  fixedFooter: boolean;
  backgroundColor?: string;
};

const BUTTON_WIDTH = 110;
const FOOTER_BUTTON_GAP = 10;
const FOOTER_DEFAULT_BG_COLOR = "#fff";
const FOOTER_PADDING_TOP = FORM_PADDING_Y;
const TITLE_MARGIN_BOTTOM = 16;
const FOOTER_SCROLL_ACTIVE_CLASS_NAME = "scroll-active";

const StyledFormFooter = styled.div<StyledFooterProps>`
  background-color: ${({ backgroundColor }) =>
    backgroundColor || FOOTER_DEFAULT_BG_COLOR};
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: ${FORM_PADDING_Y}px ${FORM_PADDING_X}px;
  padding-top: ${FOOTER_PADDING_TOP}px;
  position: ${({ fixedFooter }) => fixedFooter && "sticky"};
  width: 100%;

  &.${FOOTER_SCROLL_ACTIVE_CLASS_NAME} {
    box-shadow: 0px -10px 10px -10px ${Colors.GREY_3};
    border-top: 1px solid ${Colors.GREY_3};
  }

  && > button,
  && > div {
    width: ${BUTTON_WIDTH}px;
  }

  && > button,
  && > div {
    margin-right: ${FOOTER_BUTTON_GAP}px;
  }

  & > button:last-of-type {
    margin-right: 0;
  }
`;

const StyledForm = styled.form<StyledFormProps>`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: ${({ scrollContents }) => (scrollContents ? "auto" : "hidden")};
`;

const StyledTitle = styled(Text)`
  font-weight: bold;
  font-size: ${TEXT_SIZES.HEADING1};
  word-break: break-word;
  margin-bottom: ${TITLE_MARGIN_BOTTOM}px;
`;

const StyledFormBody = styled.div<StyledFormBodyProps>`
  height: ${({ stretchBodyVertically }) =>
    stretchBodyVertically ? "100%" : "auto"};
  padding: ${FORM_PADDING_Y}px ${FORM_PADDING_X}px;
`;

const StyledResetButtonWrapper = styled.div`
  background: #fff;
`;

function Form<TValues = any>({
  backgroundColor,
  children,
  disabledWhenInvalid,
  fixedFooter,
  getFormData,
  hideFooter,
  isSubmitting,
  onSubmit,
  registerResetObserver,
  resetButtonStyles,
  schema,
  scrollContents,
  showReset,
  stretchBodyVertically,
  submitButtonStyles,
  title,
  unregisterResetObserver,
  updateFormData,
}: FormProps<TValues>) {
  const valuesRef = useRef({});
  const methods = useForm();
  const { formState, reset, watch } = methods;
  const { errors } = formState;
  const isFormInValid = !isEmpty(errors);

  const { bodyRef, footerRef } = useFixedFooter<
    HTMLFormElement,
    HTMLDivElement
  >({
    activeClassName: FOOTER_SCROLL_ACTIVE_CLASS_NAME,
    fixedFooter,
  });

  const onReset = (event?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event?.preventDefault?.();

    const defaultValues = schema
      ? schemaItemDefaultValue(schema[ROOT_SCHEMA_KEY])
      : {};

    if (typeof defaultValues === "object") {
      reset(defaultValues);
    }
  };

  useEffect(() => {
    const debouncedUpdateFormData = debounce(updateFormData, 300);
    let isMounting = true;

    const formData = getFormData();

    /**
     * Hydration logic -
     * If on mounting if it is mounted for the very first time then the formData
     * would be empty and the formData has to be hydrated with the default value.
     *
     * When the widget is dragged, the Form component is remounted but we want
     * to preserve the values entered in the form before it was dragged and repositioned.
     * In this case the formData (meta) is used to hydrate the form.
     */
    if (isEmpty(formData) && schema && schema[ROOT_SCHEMA_KEY]) {
      const defaultValues = schemaItemDefaultValue(schema[ROOT_SCHEMA_KEY]);
      debouncedUpdateFormData(defaultValues as TValues);
    } else {
      // TODO: When the accessor changes, this formData needs to be converted to have
      // identifier as keys
      reset(formData);
    }

    const subscription = watch((values) => {
      if (isMounting) {
        isMounting = false;
        return;
      }

      if (!equal(valuesRef.current, values)) {
        const clonedValue = cloneDeep(values);
        valuesRef.current = clonedValue;
        debouncedUpdateFormData(clonedValue as TValues);
      }
    });

    registerResetObserver(onReset);

    return () => {
      subscription.unsubscribe();
      unregisterResetObserver();
    };
  }, []);

  useEffect(() => {
    if (!scrollContents && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0 });
    }
  }, [scrollContents]);

  return (
    <FormProvider {...methods}>
      <StyledForm ref={bodyRef} scrollContents={scrollContents}>
        <StyledFormBody stretchBodyVertically={stretchBodyVertically}>
          <StyledTitle>{title}</StyledTitle>
          {children}
        </StyledFormBody>
        {!hideFooter && (
          <StyledFormFooter
            backgroundColor={backgroundColor}
            fixedFooter={fixedFooter}
            ref={footerRef}
          >
            {showReset && (
              <StyledResetButtonWrapper>
                <Button
                  {...resetButtonStyles}
                  onClick={onReset}
                  text="Reset"
                  type="reset"
                />
              </StyledResetButtonWrapper>
            )}
            <Button
              {...submitButtonStyles}
              disabled={disabledWhenInvalid && isFormInValid}
              loading={isSubmitting}
              onClick={onSubmit}
              text="Submit"
              type="submit"
            />
          </StyledFormFooter>
        )}
      </StyledForm>
    </FormProvider>
  );
}

export default Form;