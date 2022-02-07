import React from "react";
import styled from "styled-components";
import Button, { Size } from "components/ads/Button";
import TemplateSampleImage from "./template-test.png";

const TemplateWrapper = styled.div`
  border: 1px solid #e7e7e7;
  flex: 1;
  max-width: 50%;
`;

const ImageWrapper = styled.div`
  padding: 20px 24px;
  width: 100%;
  height: 220px;
  overflow: hidden;
`;

const StyledImage = styled.img`
  box-shadow: 0px 17.52px 24.82px rgba(0, 0, 0, 0.09);
`;

const TemplateContent = styled.div`
  border-top: 0.73px solid #e7e7e7;
  padding: 16px 25px;

  .title {
    font-weight: bold;
    font-size: 18px;
    line-height: 24px;
    letter-spacing: -0.24px;
    color: #191919;
  }
  .categories {
    font-weight: 500;
    font-size: 14px;
    line-height: 19px;
    letter-spacing: -0.24px;
    color: #393939;
    margin-top: 4px;
  }
  .description {
    margin-top: 6px;
  }
`;

const TemplateContentFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DatasourceChip = styled.div`
  background-color: rgba(248, 248, 248, 0.5);
  border: 1px solid #e7e7e7;
  padding: 4px 9px;
  display: inline-flex;
  align-items: center;
  margin-top: 19px;
  .image {
    height: 15px;
    width: 15px;
    display: inline-block;
  }
  span {
    margin-left: 6px;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: -0.221538px;
    color: #191919;
  }
`;

const StyledButton = styled(Button)`
  border-radius: 18px;
  width: 38px;
`;

function Template() {
  return (
    <TemplateWrapper>
      <ImageWrapper>
        <StyledImage src={TemplateSampleImage} />
      </ImageWrapper>
      <TemplateContent>
        <div className="title">Job Application Tracker</div>
        <div className="categories">Customer Support • DevOps</div>
        <div className="description">
          An admin panel for reading from and writing to your customer data,
          built on PostgreSQL. This app lets you look through, edit, and add
          users, orders, and products. An admin panel for reading from and
          writing to your customer data, built on PostgreSQL.
        </div>
        <TemplateContentFooter>
          <DatasourceChip>
            <img
              className="image"
              src={"https://assets.appsmith.com/logo/mongodb.svg"}
            />
            <span>MongoDB</span>
          </DatasourceChip>
          <StyledButton icon={"fork"} size={Size.large} />
        </TemplateContentFooter>
      </TemplateContent>
    </TemplateWrapper>
  );
}

export default Template;