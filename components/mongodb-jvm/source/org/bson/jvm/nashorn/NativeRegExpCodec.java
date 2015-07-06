/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonRegularExpression;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import jdk.nashorn.internal.objects.NativeBoolean;
import jdk.nashorn.internal.objects.NativeRegExp;

/**
 * A BSON codec for Nashorn's {@link NativeRegExp}.
 * 
 * @author Tal Liron
 */
public class NativeRegExpCodec implements Codec<NativeRegExp>
{
	//
	// Codec
	//

	public Class<NativeRegExp> getEncoderClass()
	{
		return NativeRegExp.class;
	}

	public void encode( BsonWriter writer, NativeRegExp nativeRegExp, EncoderContext encoderContext )
	{
		String source = nativeRegExp.get( "source" ).toString();

		Object isGlobal = nativeRegExp.get( "global" );
		Object isIgnoreCase = nativeRegExp.get( "ignoreCase" );
		Object isMultiLine = nativeRegExp.get( "multiline" );

		String options = "";
		if( ( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) ) || ( ( isGlobal instanceof NativeBoolean ) && ( (NativeBoolean) isGlobal ).booleanValue() ) )
			options += "g";
		if( ( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) ) || ( ( isIgnoreCase instanceof NativeBoolean ) && ( (NativeBoolean) isIgnoreCase ).booleanValue() ) )
			options += "i";
		if( ( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) ) || ( ( isMultiLine instanceof NativeBoolean ) && ( (NativeBoolean) isMultiLine ).booleanValue() ) )
			options += "m";

		writer.writeRegularExpression( new BsonRegularExpression( source, options ) );
	}

	public NativeRegExp decode( BsonReader reader, DecoderContext decoderContext )
	{
		BsonRegularExpression bsonRegularExpression = reader.readRegularExpression();
		return (NativeRegExp) NativeRegExp.constructor( true, null, bsonRegularExpression.getPattern(), bsonRegularExpression.getOptions() );
	}
}
