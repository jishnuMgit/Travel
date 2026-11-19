CREATE OR REPLACE PROCEDURE dbo.sp_pageservicechgpolydocattach(
    IN p_strmode character varying,
    IN p_gstrcoid character varying,
    IN p_straccountid character varying,
    IN p_intslno smallint,
    IN p_strnote character varying,
    IN p_strdoxtype character varying,
    IN p_strdoxname character varying,
    IN p_imgdox bytea,
    IN p_gstruserid character varying,
    IN p_original_fslno smallint,
    IN p_strtype character varying,
    OUT p_result jsonb)
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_mode text := UPPER(TRIM(p_strmode));
    v_row_count integer;
BEGIN
    p_result := NULL;

    IF v_mode = 'G' THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
        INTO p_result
        FROM (
            SELECT
                fslno,
                fnote,
                fdoxname,
                replace(encode(fdox, 'base64'), E'\n', '') AS fdox,
                fdoxtype,
                ftype
            FROM dbo.tblaccountattach
            WHERE fcoid = p_gstrcoid
              AND faccountid = p_straccountid
              AND ftype = p_strtype
            ORDER BY fslno
        ) x;

    ELSIF v_mode = 'S' THEN
        INSERT INTO dbo.tblaccountattach
        (
            fcoid,
            faccountid,
            fslno,
            fnote,
            fdoxname,
            fdox,
            fdoxtype,
            ftype,
            fcuserid,
            fcuserdate
        )
        VALUES
        (
            p_gstrcoid,
            p_straccountid,
            p_intslno,
            p_strnote,
            p_strdoxname,
            p_imgdox,
            p_strdoxtype,
            p_strtype,
            p_gstruserid,
            CURRENT_TIMESTAMP
        );

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'inserted_count', v_row_count,
            'message', 'Document attachment inserted successfully'
        );

    ELSIF v_mode = 'M1' THEN
        UPDATE dbo.tblaccountattach
        SET
            fslno = p_intslno,
            fnote = p_strnote,
            fdoxname = p_strdoxname,
            fdox = p_imgdox,
            fdoxtype = p_strdoxtype,
            ftype = p_strtype,
            fmuserid = p_gstruserid,
            fmuserdate = CURRENT_TIMESTAMP
        WHERE fcoid = p_gstrcoid
          AND faccountid = p_straccountid
          AND ftype = p_strtype
          AND fslno = p_original_fslno;

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'updated_count', v_row_count,
            'message',
            CASE WHEN v_row_count > 0
                THEN 'Document attachment updated successfully'
                ELSE 'No matching document attachment found'
            END
        );

    ELSIF v_mode = 'D1' THEN
        DELETE FROM dbo.tblaccountattach
        WHERE fcoid = p_gstrcoid
          AND faccountid = p_straccountid
          AND ftype = p_strtype
          AND fslno = p_original_fslno;

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        p_result := jsonb_build_object(
            'deleted_count', v_row_count,
            'message',
            CASE WHEN v_row_count > 0
                THEN 'Document attachment deleted successfully'
                ELSE 'No matching document attachment found'
            END
        );

    ELSE
        RAISE EXCEPTION 'Invalid document attachment mode: %', p_strmode;
    END IF;
END;
$BODY$;

ALTER PROCEDURE dbo.sp_pageservicechgpolydocattach(
    character varying,
    character varying,
    character varying,
    smallint,
    character varying,
    character varying,
    character varying,
    bytea,
    character varying,
    smallint,
    character varying)
OWNER TO postgres;
